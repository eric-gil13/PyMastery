"""
PyMastery 7-Day High-Density Curriculum Registry
"""

from typing import Dict, Any, List, Optional, Union
from server.models import Challenge, CurriculumOverview, TestCase, Track

# Import Day Curriculum Modules
from server.curriculum import (
    day01_numpy,
    day02_pandas,
    day03_matplotlib,
    day04_sklearn,
    day05_pytorch_autograd,
    day06_pytorch_nn,
    day07_full_pipeline,
)

DAYS = [
    day01_numpy.get_curriculum(),
    day02_pandas.get_curriculum(),
    day03_matplotlib.get_curriculum(),
    day04_sklearn.get_curriculum(),
    day05_pytorch_autograd.get_curriculum(),
    day06_pytorch_nn.get_curriculum(),
    day07_full_pipeline.get_curriculum(),
]

DAYS_BY_ID = {day["day_id"]: day for day in DAYS}
DAYS_BY_NUM = {day["day_number"]: day for day in DAYS}


def get_all_curriculum() -> List[Dict[str, Any]]:
    """Return complete list of all 7 days with primers, walkthroughs, and challenges."""
    return DAYS


def get_day(day_id_or_number: Union[str, int]) -> Optional[Dict[str, Any]]:
    """Lookup day data by day_id (e.g. 'day01', 'day1') or day_number (1 to 7)."""
    if isinstance(day_id_or_number, int):
        return DAYS_BY_NUM.get(day_id_or_number)
    
    clean_id = str(day_id_or_number).lower().strip()
    if clean_id in DAYS_BY_ID:
        return DAYS_BY_ID[clean_id]
    
    # Handle aliases like 'day1' -> 'day01'
    if clean_id.startswith("day") and clean_id[3:].isdigit():
        num = int(clean_id[3:])
        return DAYS_BY_NUM.get(num)
        
    return None


def get_challenge(day_id_or_number: Union[str, int, None] = None, challenge_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Lookup a specific challenge by day and challenge_id, or by challenge_id across all days.
    """
    # If only one argument is provided and it's a challenge_id
    if challenge_id is None and isinstance(day_id_or_number, str):
        if "ch" in day_id_or_number or not day_id_or_number.startswith("day") or len(day_id_or_number) > 6:
            challenge_id = day_id_or_number
            day_id_or_number = None

    if day_id_or_number is not None:
        day = get_day(day_id_or_number)
        if day is not None:
            for ch in day["challenges"]:
                if ch["id"] == challenge_id:
                    return ch
        return None

    # Search across all days if day_id is not specified
    if challenge_id is not None:
        for day in DAYS:
            for ch in day["challenges"]:
                if ch["id"] == challenge_id:
                    return ch

    return None


# -----------------------------------------------------------------------------
# PyMastery Server Integration (Pydantic models for REST endpoints & Runner)
# -----------------------------------------------------------------------------

def _convert_to_challenge_models() -> List[Challenge]:
    """Converts 7-day curriculum challenges into FastAPI Challenge models."""
    models: List[Challenge] = []
    
    difficulty_map = {
        "Easy": "Beginner",
        "Beginner": "Beginner",
        "Medium": "Intermediate",
        "Intermediate": "Intermediate",
        "Hard": "Advanced",
        "Advanced": "Advanced",
        "Expert": "Expert"
    }

    for day in DAYS:
        day_num = day["day_number"]
        track_id = f"track-day{day_num:02d}"
        track_title = day["title"]
        
        for ch in day["challenges"]:
            diff = difficulty_map.get(ch.get("difficulty", "Intermediate"), "Intermediate")
            
            # Formulate test cases
            test_cases = [
                TestCase(
                    name=f"Comprehensive Test Suite for {ch['title']}",
                    test_code=ch["test_suite"],
                    description=f"Automated test harness for {ch['id']}"
                )
            ]
            
            model = Challenge(
                id=ch["id"],
                track_id=track_id,
                track_name=track_title,
                title=ch["title"],
                difficulty=diff,
                category=ch.get("category", "General"),
                xp_reward=150 + day_num * 25,
                estimated_minutes=25,
                description_markdown=f"{ch['description']}\n\n### Instructions:\n{ch.get('instructions', '')}",
                hints=ch.get("hints", []),
                starter_code=ch["starter_code"],
                solution_code=ch["reference_solution"],
                test_cases=test_cases,
                tags=day.get("concepts_covered", [])[:4]
            )
            models.append(model)
            
    return models


# Global tracks and challenges for FastAPI API routes
CURRICULUM_CHALLENGES = _convert_to_challenge_models()

TRACKS: List[Track] = [
    Track(
        id=f"track-day{day['day_number']:02d}",
        title=day["title"],
        description=day["tagline"],
        icon=["Cpu", "Table", "BarChart3", "Layers", "BrainCircuit", "Zap", "Rocket"][day["day_number"] - 1],
        badge=["⚡ NumPy Veteran", "📊 Pandas Pro", "📈 Viz Master", "🛡️ ML Architect", "🔥 Autograd Expert", "🧠 Deep Learner", "🏆 Capstone Master"][day["day_number"] - 1],
        order=day["day_number"],
        difficulty=["Intermediate", "Intermediate", "Intermediate", "Advanced", "Advanced", "Advanced", "Expert"][day["day_number"] - 1],
        challenge_count=len(day["challenges"]),
        challenges=[c for c in CURRICULUM_CHALLENGES if c.track_id == f"track-day{day['day_number']:02d}"]
    )
    for day in DAYS
]

CHALLENGES = CURRICULUM_CHALLENGES


class CurriculumService:
    """Provides curriculum tracks and challenges for the FastAPI web server."""

    def __init__(self):
        self._tracks = {t.id: t for t in TRACKS}
        self._challenges = {c.id: c for c in CHALLENGES}
        for t in self._tracks.values():
            t.challenges = [c for c in CHALLENGES if c.track_id == t.id]
            t.challenge_count = len(t.challenges)

    def get_overview(self) -> CurriculumOverview:
        total_xp = sum(c.xp_reward for c in CHALLENGES)
        return CurriculumOverview(
            tracks=list(self._tracks.values()),
            total_challenges=len(CHALLENGES),
            total_xp=total_xp,
        )

    def get_tracks(self) -> List[Track]:
        return list(self._tracks.values())

    def list_tracks(self) -> List[Track]:
        return list(self._tracks.values())

    def get_track_by_day(self, day_num: int) -> Optional[Track]:
        return self._tracks.get(f"track-day{day_num:02d}")

    def get_challenge(self, challenge_id: str) -> Optional[Challenge]:
        if not challenge_id:
            return None
        # 1. Exact match in dictionary
        if challenge_id in self._challenges:
            return self._challenges[challenge_id]

        clean = challenge_id.strip().lower()
        if clean in self._challenges:
            return self._challenges[clean]

        # 2. Match patterns like 'd1-c1', 'd1_c2', 'day01_c01', 'track-day01_ch02'
        import re
        m = re.match(r"(?:track[-_])?(?:day|d)0?(\d+)[-_](?:ch|c)0?(\d+)", clean)
        if m:
            day_num = int(m.group(1))
            ch_idx = int(m.group(2)) - 1
            track = self.get_track_by_day(day_num)
            if track and 0 <= ch_idx < len(track.challenges):
                return track.challenges[ch_idx]

        # 3. Match by partial substring in challenge ID or title
        for cid, ch in self._challenges.items():
            if clean in cid.lower() or cid.lower() in clean or clean in ch.title.lower():
                return ch

        return None

    def list_challenges(self, track_id: Optional[str] = None) -> List[Challenge]:
        if track_id:
            return [c for c in CHALLENGES if c.track_id == track_id]
        return list(self._challenges.values())


curriculum = CurriculumService()
