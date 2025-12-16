from __future__ import annotations

from abc import ABC, abstractmethod


class BaseTTS(ABC):
    @abstractmethod
    def synthesize(self, text: str, *, sid: int = 0, speed: float = 1.0) -> bytes:
        """Return WAV bytes (PCM) for the given text."""
        raise NotImplementedError
