(function () {
    document.querySelectorAll(".card").forEach(function (card) {
        if (card.dataset.noAutobest === "1") return;

        var firstWeapon = card.querySelector(".weapons-grid .weapon");
        if (firstWeapon && !firstWeapon.classList.contains("best")) {
            firstWeapon.classList.add("best");
        }

        var firstArtifact = card.querySelector(
            ".artifacts-grid .artifact, .artifacts-grid .artifact--split"
        );
        if (firstArtifact && !firstArtifact.classList.contains("best")) {
            firstArtifact.classList.add("best");
        }

        var teamRows = card.querySelectorAll(".team-row");
        teamRows.forEach(function (teamRow) {
            var firstTeamLine = teamRow.querySelector(".team-line");
            if (firstTeamLine) {
                var members = firstTeamLine.querySelectorAll(".member, img");
                if (members.length > 0) {
                    members.forEach(function (member) {
                        if (member.classList.contains("member")) {
                            if (!member.classList.contains("best")) {
                                member.classList.add("best");
                            }
                        } else if (member.tagName === "IMG") {
                            var wrapper = document.createElement("div");
                            wrapper.className = "member best";
                            member.parentNode.insertBefore(wrapper, member);
                            wrapper.appendChild(member);
                        }
                    });
                }
            }
        });
    });
})();