# test_node_communicator.py
import sys
import time
from node_to_python import NodeCommunicator

def on_message(message: str):
    print("Message received via callback:", message)
    # If the message equals "exit", terminate execution
    if message.strip() == "exit":
        communicator.send("Terminating...")
        sys.exit(0)
    else:
        communicator.send("Echo: " + message)

def on_error(error):
    print("Error:", error)

def on_close():
    print("Connection closed.")

# Create an instance of NodeCommunicator with handlers
communicator = NodeCommunicator(
    on_message=on_message,
    on_error=on_error,
    on_close=on_close,
    logging=True
)

# Start asynchronous message listening (if needed)
communicator.start()

import time
while True:
    time.sleep(1)


# # Example of synchronous reading using the library's read_message() method
# while True:
#     # Read a message using the read_message() method
#     user_message = communicator.read_message().strip()
#     if user_message:
#         print("Synchronously read:", user_message)
#         # Process the message (for example, sending an echo reply)
#         communicator.send("Echo (synchronously): " + user_message)
#     time.sleep(0.1)