(function () {
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-video-panel]"));
  var toggleButton = document.querySelector("[data-video-toggle]");
  var progressInput = document.querySelector("[data-video-progress]");
  var leftDelayMs = 550;
  var leftPlayTimer = null;
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

  function clearLeftTimer() {
    if (leftPlayTimer) {
      window.clearTimeout(leftPlayTimer);
      leftPlayTimer = null;
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

    if (!duration || isSeeking) {
      return;
    }

    progressInput.value = String((videos.right.currentTime / duration) * 100);
  }

  function playPair() {
    var hasStarted = videos.left.currentTime > 0 || videos.right.currentTime > 0;

    clearLeftTimer();
    setButtonState(true);
    playVideo(videos.right);

    if (hasStarted) {
      playVideo(videos.left);
      return;
    }

    leftPlayTimer = window.setTimeout(function () {
      leftPlayTimer = null;
      playVideo(videos.left);
    }, leftDelayMs);
  }

  function pausePair() {
    clearLeftTimer();
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
      var isPlaying = !videos.right.paused || !videos.left.paused || Boolean(leftPlayTimer);

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
      var nextLeftTime = Math.max(0, nextRightTime - leftDelayMs / 1000);

      clearLeftTimer();
      videos.right.currentTime = nextRightTime;
      videos.left.currentTime = nextLeftTime;
      isSeeking = false;
      updateProgress();
    });

    [videos.left, videos.right].forEach(function (video) {
      video.addEventListener("timeupdate", updateProgress);

      video.addEventListener("ended", function () {
        if (videos.left.ended && videos.right.ended) {
          clearLeftTimer();
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
