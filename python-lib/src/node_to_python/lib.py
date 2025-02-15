# node_communicator.py
import sys
import io
import threading

class NodeCommunicator:
    def __init__(self, on_message=None, on_error=None, on_close=None, logging=True):
        """
        :param on_message: function called when a message is received (accepts a string)
        :param on_error: function for error handling (accepts an exception object)
        :param on_close: function called when reading is finished (no parameters)
        :param logging: if True, logs messages
        """
        self.on_message = on_message
        self.on_error = on_error
        self.on_close = on_close
        self.logging = logging
        self.running = False

        # Ensure proper UTF-8 support
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    def encode_to_numbers(self, text: str) -> str:
        """Converts a string into a string of numbers separated by commas."""
        return ",".join(str(ord(c)) for c in text)

    def decode_from_numbers(self, text: str) -> str:
        """Decodes a comma-separated string of numbers back into a string."""
        try:
            numbers = text.strip().split(',')
            return "".join(chr(int(num)) for num in numbers if num)
        except Exception as e:
            if self.logging:
                print("Decoding error:", e, file=sys.stderr)
            if self.on_error:
                self.on_error(e)
            return ""

    def send(self, message: str) -> None:
        """Sends a message (after encoding it) to Node."""
        encoded = self.encode_to_numbers(" " + message + " ")
        print(encoded)
        sys.stdout.flush()
        if self.logging:
            print("Sent to Node:", message)

    def read_message(self) -> str:
        """
        Reads a single message from standard input (stdin)
        and decodes it from numeric format.
        """
        line = sys.stdin.readline()
        return self.decode_from_numbers(line)

    def _listen(self):
        """Internal method to listen for incoming messages in a separate thread."""
        self.running = True
        if self.logging:
            print("NodeCommunicator: Starting to listen for incoming messages...")
        while self.running:
            line = sys.stdin.readline()
            if not line:
                break
            decoded_message = self.decode_from_numbers(line)
            if self.logging:
                print("Received from Node:", decoded_message)
            if self.on_message:
                try:
                    self.on_message(decoded_message)
                except Exception as e:
                    if self.on_error:
                        self.on_error(e)
        self.running = False
        if self.on_close:
            self.on_close()
        if self.logging:
            print("NodeCommunicator: Listening stopped.")

    def start(self):
        """Starts listening to the incoming stream in a separate thread."""
        listener_thread = threading.Thread(target=self._listen, daemon=True)
        listener_thread.start()
