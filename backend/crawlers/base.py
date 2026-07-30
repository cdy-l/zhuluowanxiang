from abc import ABC, abstractmethod


class BaseCrawler(ABC):
    @property
    @abstractmethod
    def id(self) -> str: ...

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @property
    @abstractmethod
    def icon(self) -> str: ...

    @abstractmethod
    def get_info(self) -> dict: ...

    @abstractmethod
    def execute(self, params: dict) -> dict: ...
