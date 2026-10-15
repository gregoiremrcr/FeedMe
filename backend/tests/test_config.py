import pytest
from app.core.config import Settings
from pydantic import ValidationError


def test_overpass_timeout_defaults_to_30_seconds(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OVERPASS_TIMEOUT_SECONDS", raising=False)

    settings = Settings(_env_file=None)

    assert settings.overpass_timeout_seconds == 30.0


@pytest.mark.parametrize("timeout", ["1", "30", "60"])
def test_overpass_timeout_can_be_configured(
    monkeypatch: pytest.MonkeyPatch,
    timeout: str,
) -> None:
    monkeypatch.setenv("OVERPASS_TIMEOUT_SECONDS", timeout)

    settings = Settings(_env_file=None)

    assert settings.overpass_timeout_seconds == float(timeout)


@pytest.mark.parametrize("timeout", ["0", "60.1", "invalid"])
def test_overpass_timeout_rejects_values_outside_supported_range(
    monkeypatch: pytest.MonkeyPatch,
    timeout: str,
) -> None:
    monkeypatch.setenv("OVERPASS_TIMEOUT_SECONDS", timeout)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
