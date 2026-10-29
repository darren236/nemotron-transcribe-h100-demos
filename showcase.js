const videos = [...document.querySelectorAll("video")];

for (const current of videos) {
  current.addEventListener("play", () => {
    for (const other of videos) {
      if (other !== current) other.pause();
    }
  });
}
