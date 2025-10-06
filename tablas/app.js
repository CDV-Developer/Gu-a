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
            if (!firstTeamLine) return;

            firstTeamLine.querySelectorAll('img').forEach(function (img) {
                if (img.parentElement && img.parentElement.classList.contains('member')) return;

                var wrapper = document.createElement('div');
                wrapper.className = 'member';
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            });
        });
    });

    try {
        var supportsHas = CSS.supports('selector(:has(*))');
    } catch (e) {
        var supportsHas = false;
    }

    document.querySelectorAll('.team-line').forEach(function (line) {
        if (line.querySelector('.member.best')) {
            line.classList.add('has-best');
            line.classList.remove('no-best');
        } else {
            line.classList.add('no-best');
            line.classList.remove('has-best');
        }
    });
})();