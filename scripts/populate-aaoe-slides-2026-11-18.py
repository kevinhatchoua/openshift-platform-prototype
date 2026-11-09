#!/usr/bin/env python3
"""Populate AAOE Google Slides via gws batchUpdate (run once)."""
import json
import subprocess
import sys

PRESENTATION_ID = "11M96fgB61a9lxxqSmbaulqdHhuAkI0AEanzhelgwx9I"

SLIDES = [
    # index 0 = default title slide (handled separately)
    (
        "Today we focus on what admins feel during risky updates",
        "In scope\n"
        "• Cluster version updates (agent-led and manual)\n"
        "• Installed operators and OLM v0 / cluster extensions (v1)\n"
        "• Pre-check with AI, troubleshoot with AI, agentic runs\n\n"
        "Out of scope (February session)\n"
        "• GitOps agentic remediation and deep rollouts\n"
        "• Networking topology (separate track)",
    ),
    (
        "Updates fail quietly until workloads break",
        "• Hidden dependencies and compatibility risk on cluster and operator updates\n"
        "• Canary / staged node strategies vs full cluster choices\n"
        "• OLM v0 to cluster extension migration adds admin cognitive load\n"
        "• Customers want guided pre-checks and human-in-the-loop execution",
    ),
    (
        "Three complementary LightSpeed patterns",
        "Pre-check with AI: before cluster or operator update (near primary update controls)\n\n"
        "Troubleshoot with AI: degraded or incompatible operator (detail page alert)\n\n"
        "Agentic run: longer analysis and audit trail (Agentic Runs list + links)",
    ),
    (
        "OLM is in coexistence and migration mode",
        "• Subscriptions (OLM v0) and cluster extensions (OLM v1) live together\n"
        "• Engineering priority: safe migration, not AI on every surface\n"
        "• Demo shows where LightSpeed helps once lifecycle UX is stable\n\n"
        "Prototype: openshift-platform-prototype.vercel.app/ecosystem/installed-operators",
    ),
    (
        "Demo: Cluster update",
        "• Target version and channel context\n"
        "• Pre-check with AI for operator and platform readiness\n"
        "• Agentic run records analysis for audit\n\n"
        "openshift-platform-prototype.vercel.app/administration/cluster-update",
    ),
    (
        "Demo: Installed operators",
        "• List: fleet-level AI assessment vs target cluster version\n"
        "• Extension detail: pre-check on update, troubleshoot on failed migration\n"
        "• Classic operator detail: troubleshoot when status needs attention",
    ),
    (
        "Demo: Agentic runs",
        "• Central list of LightSpeed-driven analyses\n"
        "• Detail: request prompt, assessment report, download for change review\n"
        "• MVP: View agentic run links on list and detail surfaces\n\n"
        "openshift-platform-prototype.vercel.app/agentic-runs",
    ),
    (
        "We validate on shipped 5.0, not vision-only mocks",
        "• Customer sessions on live clusters (Marc, Subin, Matt)\n"
        "• Recurring customer cadence (Dave Thomas / field)\n"
        "• February AAOSE: GitOps agentic experiences",
    ),
    (
        "Questions and resources",
        "Prototype: openshift-platform-prototype.vercel.app\n"
        "Speakers: Kevin Hatchoua, Peter Kreuser\n"
        "Agenda: Cluster and operator updates with OpenShift Lightspeed "
        "(OLM-focused; GitOps deferred to February)\n\n"
        "Thank you for joining Ask an OpenShift Expert.",
    ),
]


def main() -> None:
    requests = [
        {
            "insertText": {
                "objectId": "i0",
                "insertionIndex": 0,
                "text": "Cluster & operator updates with OpenShift Lightspeed",
            }
        },
        {
            "insertText": {
                "objectId": "i1",
                "insertionIndex": 0,
                "text": "Ask an OpenShift Expert · 18 November 2026\nKevin Hatchoua & Peter Kreuser",
            }
        },
    ]

    for idx, (title, body) in enumerate(SLIDES, start=2):
        sid = f"slide{idx:03d}"
        title_id = f"{sid}_title"
        body_id = f"{sid}_body"
        requests.append(
            {
                "createSlide": {
                    "objectId": sid,
                    "insertionIndex": idx - 1,
                    "slideLayoutReference": {"predefinedLayout": "TITLE_AND_BODY"},
                    "placeholderIdMappings": [
                        {
                            "objectId": title_id,
                            "layoutPlaceholder": {"type": "TITLE", "index": 0},
                        },
                        {
                            "objectId": body_id,
                            "layoutPlaceholder": {"type": "BODY", "index": 0},
                        },
                    ],
                }
            }
        )
        requests.append({"insertText": {"objectId": title_id, "text": title}})
        requests.append({"insertText": {"objectId": body_id, "text": body}})

    body = {"requests": requests}
    cmd = [
        "gws",
        "slides",
        "presentations",
        "batchUpdate",
        "--params",
        json.dumps({"presentationId": PRESENTATION_ID}),
        "--json",
        json.dumps(body),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr or result.stdout, file=sys.stderr)
        sys.exit(result.returncode)
    print(f"OK: https://docs.google.com/presentation/d/{PRESENTATION_ID}/edit")


if __name__ == "__main__":
    main()
