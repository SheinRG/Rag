"""Studio output cache helpers."""

import json

import studio_cache as cache_module
from conftest import FakeQuery, FakeSupabase


class BoomQuery(FakeQuery):
    def execute(self, *a, **k):
        raise RuntimeError('relation "studio_cache" does not exist')


def _cache(tables):
    supabase = FakeSupabase(tables=tables)
    cache_module.supabase = supabase
    return supabase


def test_get_cached_returns_the_parsed_payload():
    rows = [{"payload": json.dumps({"topics": [{"topic": "A"}], "document_name": "d.pdf"})}]
    _cache({"studio_cache": FakeQuery(rows)})
    assert cache_module.get_cached("user-1", "doc-1", "topics") == {
        "topics": [{"topic": "A"}],
        "document_name": "d.pdf",
    }


def test_get_cached_skips_lookups_without_a_document_id():
    supabase = _cache({"studio_cache": FakeQuery([])})
    assert cache_module.get_cached("user-1", None, "topics") is None
    assert "studio_cache" not in supabase.table_calls


def test_get_cached_returns_none_on_a_miss():
    supabase = _cache({"studio_cache": FakeQuery([])})
    assert cache_module.get_cached("user-1", "doc-1", "topics") is None
    assert ("eq", ("user_id", "user-1")) in supabase.tables["studio_cache"].calls


def test_get_cached_fails_open_on_a_read_error():
    _cache({"studio_cache": BoomQuery([])})
    assert cache_module.get_cached("user-1", "doc-1", "topics") is None


def test_store_persists_a_json_payload():
    c = FakeQuery([])
    _cache({"studio_cache": c})
    cache_module.store("user-1", "doc-1", "quiz", {"questions": []})
    upserts = [x for x in c.calls if x[0] == "upsert"]
    assert len(upserts) == 1
    assert upserts[0][1][0]["feature"] == "quiz"
    assert json.loads(upserts[0][1][0]["payload"]) == {"questions": []}


def test_store_skips_without_a_document_id():
    c = FakeQuery([])
    _cache({"studio_cache": c})
    cache_module.store("user-1", None, "quiz", {})
    assert c.calls == []


def test_store_fails_open_on_a_write_error():
    _cache({"studio_cache": BoomQuery([])})
    cache_module.store("user-1", "doc-1", "summary", {"summary": "x"})


def test_purge_removes_every_feature_for_a_document():
    c = FakeQuery([])
    _cache({"studio_cache": c})
    cache_module.purge("user-1", "doc-1")
    assert any(name == "delete" for name, _ in c.calls)
    assert ("eq", ("document_id", "doc-1")) in c.calls
    assert ("eq", ("user_id", "user-1")) in c.calls


def test_purge_fails_open_on_a_missing_table():
    _cache({"studio_cache": BoomQuery([])})
    cache_module.purge("user-1", "doc-1")