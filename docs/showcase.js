(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-video-panel]"));
  var toggleButton = document.querySelector("[data-video-toggle]");
  var progressInput = document.querySelector("[data-video-progress]");
  var delayedStartSeconds = 92;
  var syncToleranceSeconds = 0.35;
  var delayedPlayTimer = null;
  var isSeeking = false;
  var videos = {};

  if (panels.length !== 2 || !toggleButton || !progressInput) {
    return;
  }

  function setButtonState(isPlaying) {
    toggleButton.innerHTML = isPlaying
      ? '<span aria-hidden="true">||</span> Pause recordings'
      : '<span aria-hidden="true">&gt;</span> Play recordings';
    toggleButton.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  }

  function setPlaceholderState() {
    toggleButton.innerHTML = '<span aria-hidden="true">&gt;</span> Add recordings to play';
    toggleButton.setAttribute("aria-pressed", "false");
    toggleButton.disabled = true;
    progressInput.disabled = true;
  }

  function clearDelayedTimer() {
    if (delayedPlayTimer) {
      window.clearTimeout(delayedPlayTimer);
      delayedPlayTimer = null;
    }
  }

  function playVideo(video) {
    var playback = video.play();

    if (playback && typeof playback.catch === "function") {
      playback.catch(function () {
        setButtonState(false);
      });
    }
  }

  function getDuration() {
    if (videos.right && Number.isFinite(videos.right.duration) && videos.right.duration > 0) {
      return videos.right.duration;
    }

    return 0;
  }

  function updateProgress() {
    var duration = getDuration();

    if (!duration || isSeeking || !videos.right) {
      return;
    }

    progressInput.value = String((videos.right.currentTime / duration) * 100);
  }

  function setDelayedVideoTime(nextTime) {
    var safeTime = Math.max(0, nextTime);

    if (
      Number.isFinite(videos.left.duration) &&
      videos.left.duration > 0
    ) {
      safeTime = Math.min(safeTime, videos.left.duration);
    }

    if (Math.abs(videos.left.currentTime - safeTime) > syncToleranceSeconds) {
      videos.left.currentTime = safeTime;
    }
  }

  function syncDelayedToMaster(shouldPlay) {
    var masterTime = videos.right.currentTime || 0;

    clearDelayedTimer();

    if (masterTime < delayedStartSeconds) {
      videos.left.pause();
      setDelayedVideoTime(0);

      if (shouldPlay) {
        delayedPlayTimer = window.setTimeout(function () {
          delayedPlayTimer = null;

          if (!videos.right.paused) {
            syncDelayedToMaster(true);
          }
        }, (delayedStartSeconds - masterTime) * 1000);
      }

      return;
    }

    setDelayedVideoTime(masterTime - delayedStartSeconds);

    if (shouldPlay && !videos.right.paused && !videos.left.ended) {
      playVideo(videos.left);
    }
  }

  function playPair() {
    if (videos.right.ended) {
      videos.right.currentTime = 0;
      setDelayedVideoTime(0);
    }

    setButtonState(true);
    playVideo(videos.right);
    syncDelayedToMaster(true);
  }

  function pausePair() {
    clearDelayedTimer();
    videos.left.pause();
    videos.right.pause();
    setButtonState(false);
  }

  function createVideo(panel) {
    var role = panel.getAttribute("data-video-panel");
    var src = panel.getAttribute("data-video-src");
    var label = panel.getAttribute("data-video-label") || "Smooth Scribble recording";
    var video = document.createElement("video");
    var source = document.createElement("source");

    video.setAttribute("data-paired-video", role);
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("aria-label", label);

    if (role === "left") {
      video.muted = true;
    }

    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    panel.innerHTML = "";
    panel.appendChild(video);
    videos[role] = video;
  }

  function enablePlayerIfReady() {
    if (!videos.left || !videos.right) {
      setPlaceholderState();
      return;
    }

    toggleButton.disabled = false;
    progressInput.disabled = false;
    setButtonState(false);

    toggleButton.addEventListener("click", function () {
      var isPlaying = !videos.right.paused || !videos.left.paused || Boolean(delayedPlayTimer);

      if (isPlaying) {
        pausePair();
        return;
      }

      playPair();
    });

    progressInput.addEventListener("input", function () {
      isSeeking = true;
    });

    progressInput.addEventListener("change", function () {
      var duration = getDuration();
      var nextRightTime = duration * (Number(progressInput.value) / 100);
      var shouldContinuePlaying = !videos.right.paused || !videos.left.paused || Boolean(delayedPlayTimer);

      clearDelayedTimer();
      videos.right.currentTime = nextRightTime;
      syncDelayedToMaster(shouldContinuePlaying);

      if (shouldContinuePlaying && videos.right.paused) {
        playVideo(videos.right);
      }

      isSeeking = false;
      updateProgress();
    });

    videos.right.addEventListener("timeupdate", function () {
      updateProgress();

      if (!videos.right.paused) {
        syncDelayedToMaster(true);
      }
    });

    [videos.left, videos.right].forEach(function (video) {
      video.addEventListener("ended", function () {
        if (video === videos.right) {
          clearDelayedTimer();
          videos.left.pause();
          setButtonState(false);
          return;
        }

        if (videos.right.ended) {
          clearDelayedTimer();
          setButtonState(false);
        }
      });
    });
  }

  function checkVideo(panel) {
    var src = panel.getAttribute("data-video-src");

    if (!src || !window.fetch) {
      return Promise.resolve();
    }

    return window
      .fetch(src, { method: "HEAD" })
      .then(function (response) {
        if (response.ok) {
          createVideo(panel);
        }
      })
      .catch(function () {
        return undefined;
      });
  }

  setPlaceholderState();
  Promise.all(panels.map(checkVideo)).then(enablePlayerIfReady);
})();
