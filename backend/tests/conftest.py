"""
Shared test setup.

Environment is stubbed *before* the app modules are imported: config.py calls
load_dotenv() at import time, and load_dotenv does not override variables that
are already set. Setting them here guarantees a test run can never pick up real
credentials from backend/.env and talk to a live project.
"""

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-at-least-32-bytes-long!!")
os.environ.setdefault("COHERE_API_KEY", "test-cohere-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("TAVILY_API_KEY", "test-tavily-key")
os.environ.setdefault("ENVIRONMENT", "test")

import pytest  # noqa: E402


class FakeQuery:
    """Chainable stand-in for the Supabase query builder."""

    def __init__(self, rows=None, count=None):
        self._rows = rows if rows is not None else []
        self._count = count
        self._single = False
        self.calls = []

    def _record(self, name, *args):
        self.calls.append((name, args))
        return self

    def select(self, *a, **k):
        return self._record("select", *a)

    def insert(self, *a, **k):
        return self._record("insert", *a)

    def update(self, *a, **k):
        return self._record("update", *a)

    def delete(self, *a, **k):
        return self._record("delete", *a)

    def eq(self, *a, **k):
        return self._record("eq", *a)

    def lt(self, *a, **k):
        return self._record("lt", *a)

    def gt(self, *a, **k):
        return self._record("gt", *a)

    def in_(self, *a, **k):
        return self._record("in_", *a)

    def order(self, *a, **k):
        return self._record("order", *a)

    def limit(self, *a, **k):
        return self._record("limit", *a)

    def range(self, *a, **k):
        return self._record("range", *a)

    def upsert(self, *a, **k):
        return self._record("upsert", *a)

    def single(self, *a, **k):
        # PostgREST's .single() returns one object, not a list.
        self._single = True
        return self._record("single", *a)

    def execute(self):
        data = self._rows
        if self._single:
            data = self._rows[0] if self._rows else None
            # A single() only affects this one execute: the same builder object is
            # sometimes reused for a second query (e.g. an update returning rows).
            self._single = False
        return type("Result", (), {"data": data, "count": self._count})()


class FakeSupabase:
    """Records rpc/table usage so tests can assert on what the code asked for."""

    def __init__(self, rpc_result=None, rpc_error=None, tables=None):
        self.rpc_result = rpc_result if rpc_result is not None else []
        self.rpc_error = rpc_error
        self.tables = tables or {}
        self.rpc_calls = []
        self.table_calls = []

    def rpc(self, name, params):
        self.rpc_calls.append((name, params))
        error = self.rpc_error
        if callable(error):
            error = error(len(self.rpc_calls))
        if error is not None:
            raise error
        return FakeQuery(self.rpc_result)

    def table(self, name):
        self.table_calls.append(name)
        return self.tables.get(name, FakeQuery([]))


@pytest.fixture
def fake_supabase():
    return FakeSupabase
