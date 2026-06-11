import threading

_thread_locals = threading.local()


def get_current_org_id() -> str | None:
    """Get the current organization ID from thread-local storage."""
    return getattr(_thread_locals, "org_id", None)


def set_current_org_id(org_id: str | None) -> None:
    """Set the current organization ID in thread-local storage."""
    _thread_locals.org_id = org_id


def get_current_user():
    """Get the current user from thread-local storage."""
    return getattr(_thread_locals, "user", None)


def set_current_user(user) -> None:
    """Set the current user in thread-local storage."""
    _thread_locals.user = user


def clear() -> None:
    """Clear all thread-local data."""
    _thread_locals.org_id = None
    _thread_locals.user = None
