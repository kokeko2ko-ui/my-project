#!/usr/bin/env python3
"""本体は .claude/skills/gemini-video-analysis/gemini_video.py に移した（どのセッションからも使えるスキルにしたため）。
このファイルは、これまでの呼び出し（python3 tools/gemini_video.py …）を壊さないための入口。"""
import os, runpy, sys
here = os.path.dirname(os.path.abspath(__file__))
runpy.run_path(os.path.join(here, '..', '..', '.claude', 'skills', 'gemini-video-analysis', 'gemini_video.py'), run_name='__main__')
