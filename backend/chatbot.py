from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import AnyMessage, add_messages
from langchain_core.messages import ToolMessage
from langchain_anthropic import ChatAnthropic
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import tools_condition
from IPython.display import Image, display
import shutil
import uuid
from dotenv import load_dotenv
from datetime import datetime
import sys
import os

# Load environment variables first, before importing modules that need them
# Look for .env in parent directory (project root) or current directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if not os.path.exists(env_path):
    env_path = ".env"
load_dotenv(env_path)

# Import from tool directory
from tool.flights import (
    fetch_user_flight_information,
    search_flights,
    update_ticket_to_new_flight,
    cancel_ticket,
)
from tool.hotels import (
    search_hotels,
    book_hotel,
    update_hotel,
    cancel_hotel,
)
from tool.carrental import (
    search_car_rentals,
    book_car_rental,
    update_car_rental,
    cancel_car_rental,
)
from tool.exection import (
    search_trip_recommendations,
    book_excursion,
    update_excursion,
    cancel_excursion,
)
from tool.utils import (
    create_tool_node_with_fallback,
    _print_event,
)
from db import db, update_dates

# Import lookup_policy
import importlib.util
spec = importlib.util.spec_from_file_location("company_policy", os.path.join(os.path.dirname(__file__), 'tool', 'company-policy.py'))
company_policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(company_policy)
lookup_policy = company_policy.lookup_policy
class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_info: str

class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable
    
    def __call__(self, state: State, config: RunnableConfig):
        while True:
            configuration = config.get("configurable", {})
            passenger_id = configuration.get("passenger_id", None)
            state = {**state, "user_info": passenger_id}
            result = self.runnable.invoke(state)
            # If the LLM happens to return an empty response, we will re-prompt it
            # for an actual response.
            if not result.tool_calls and (
                not result.content
                or isinstance(result.content, list)
                and not result.content[0].get("text")
            ):
                messages = state["messages"] + [("user", "Respond with a real output.")]
                state = {**state, "messages": messages}
            else:
                break
        return {"messages": result}

llm = ChatOpenAI(model="gpt-4-turbo-preview")

primary_assistant_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful customer support assistant for Swiss Airlines. "
            " Use the provided tools to search for flights, company policies, and other information to assist the user's queries. "
            " When searching, be persistent. Expand your query bounds if the first search returns no results. "
            " If a search comes up empty, expand your search before giving up."
            "\n\nCurrent user:\n<User>\n{user_info}\n</User>"
            "\nCurrent time: {time}.",
        ),
        ("placeholder", "{messages}"),
    ]
).partial(time=datetime.now)

part_1_safe_tools = [
    TavilySearchResults(max_results=1),
    fetch_user_flight_information,
    search_flights,
    lookup_policy,
    search_car_rentals,
    search_hotels,
    search_trip_recommendations,
]

# These tools all change the user's reservations.
# The user has the right to control what decisions are made
part_1_sensitive_tools = [
    update_ticket_to_new_flight,
    cancel_ticket,
    book_car_rental,
    update_car_rental,
    cancel_car_rental,
    book_hotel,
    update_hotel,
    cancel_hotel,
    book_excursion,
    update_excursion,
    cancel_excursion,
]

sensitive_tool_names = {t.name for t in part_1_sensitive_tools}

part_1_assistant_runnable = primary_assistant_prompt | llm.bind_tools(
    part_1_safe_tools + part_1_sensitive_tools
)

builder = StateGraph(State)

def user_info(state: State):
    return {"user_info": fetch_user_flight_information.invoke({})}

builder.add_node("fetch_user_info", user_info)
builder.add_node("assistant", Assistant(part_1_assistant_runnable))
builder.add_node("safe_tools", create_tool_node_with_fallback(part_1_safe_tools))
builder.add_node("sensitive_tools", create_tool_node_with_fallback(part_1_sensitive_tools))
builder.add_edge(START, "fetch_user_info")
builder.add_edge("fetch_user_info", "assistant")

def route_tools(state: State):
    next_node = tools_condition(state)

    if next_node ==END:
        return END
    ai_message = state["messages"][-1]
    first_tool_call = ai_message.tool_calls[0]
    if first_tool_call["name"] in sensitive_tool_names:
        return "sensitive_tools"
    return "safe_tools"
builder.add_conditional_edges("assistant", route_tools, ["safe_tools", "sensitive_tools", END])
builder.add_edge("safe_tools", "assistant")
builder.add_edge("sensitive_tools", "assistant")

memory = MemorySaver()
part_1_graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["sensitive_tools"],
    )

# Initialize database
db = update_dates(db)

# Export the graph and sensitive tool names for use in main.py
__all__ = ['part_1_graph', 'sensitive_tool_names', 'db']