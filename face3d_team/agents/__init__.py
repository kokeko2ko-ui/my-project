"""エージェント群。各エージェントは Agent プロトコルに従う。"""
from __future__ import annotations

from typing import Protocol

from ..types import Job, Stage


class Agent(Protocol):
    """全エージェント共通のインターフェース。

    run() は Job を受け取り、自分の成果物を Job に書き込んで返す。
    例外を投げた場合は Orchestrator がリトライ/中断を判断する。
    """

    name: str
    stage: Stage

    def run(self, job: Job) -> Job: ...
