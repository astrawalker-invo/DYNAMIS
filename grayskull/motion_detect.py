import signal
import sys


def main() -> None:
    print("Grayskull motion detector scaffold ready.")


def handle_exit(signum, frame):  # noqa: ARG001
    print("Shutting down Grayskull.")
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_exit)
    main()
