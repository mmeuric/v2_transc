#!/bin/bash

URL="http://localhost:3021/v1/users/"

# Le JSON est mis dans un heredoc pour plus de lisibilité
JSON=$(cat <<EOF
{
  "tournament": {
    "tournament_type": "1vs1",
    "tournament_name": "Summer Cup 2025 '1vs1'",
    "started_at": "2025-07-01T14:00:00Z",
    "ended_at": "2025-07-15T18:00:00Z",
    "first_position_user_id_1": 4,
    "first_position_user_id_2": null,
    "second_position_user_id_1": 5,
    "second_position_user_id_2": null,
    "thirth_position_user_id_1": 6,
    "thirth_position_user_id_2": null,
    "fourth_position_user_id_1": 7,
    "fourth_position_user_id_2": null,
    "winner_user_id_1": 4,
    "winner_user_id_2": null
  },
  "games_history": [
    {
        "game_type": "1vs1",
        "team_1_player_user_id_1": 4,
        "team_1_player_user_id_2": null,
        "team_2_player_user_id_3": 5,
        "team_2_player_user_id_4": null,
        "started_at": "2025-07-01T15:00:00Z",
        "ended_at": "2025-07-01T15:30:00Z",
        "score_team_1": 5,
        "score_team_2": 4,
        "winner_user_id_1": 4,
        "winner_user_id_2": null
    },
    {
        "game_type": "1vs1",
        "team_1_player_user_id_1": 6,
        "team_1_player_user_id_2": null,
        "team_2_player_user_id_3": 7,
        "team_2_player_user_id_4": null,
        "started_at": "2025-07-03T16:00:00Z",
        "ended_at": "2025-07-03T16:30:00Z",
        "score_team_1": 2,
        "score_team_2": 5,
        "winner_user_id_1": 7,
        "winner_user_id_2": null
    },
    {
        "game_type": "1vs1",
        "team_1_player_user_id_1": 7,
        "team_1_player_user_id_2": null,
        "team_2_player_user_id_3": 4,
        "team_2_player_user_id_4": null,
        "started_at": "2025-07-10T17:00:00Z",
        "ended_at": "2025-07-10T17:30:00Z",
        "score_team_1": 1,
        "score_team_2": 5,
        "winner_user_id_1": 4,
        "winner_user_id_2": null
    }
  ]
}
EOF
)

# Envoi avec curl
curl -X POST "$URL" \
     -H "Content-Type: application/json" \
     -d "$JSON"
