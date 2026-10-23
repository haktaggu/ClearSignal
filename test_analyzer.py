
from analyzer import analyze_conversation

result = analyze_conversation(
    ["There are no extra fees."],
    "You need to pay a $200 processing fee."
)

assert any(
    item["type"] == "possible_contradiction"
    for item in result["findings"]
)

print("Test passed!")
