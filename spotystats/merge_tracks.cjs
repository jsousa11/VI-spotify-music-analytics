const fs = require("fs");
const readline = require("readline");

// ---- CONFIG ---- //
const dataset1_path = "./public/datasets/data.csv";
const dataset1_2_path = "./public/datasets/dataset.csv";
const dataset2_path = "./public/datasets/Best Songs on Spotify from 2000-2023.csv";
const output_path = "./public/datasets/matched_tracks3.csv";
// ---------------- //

function parseCSVLine(line, delimiter) {
  return line.split(delimiter).map(v => v.trim());
}

async function loadDataset1(path) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream });

  let columns = [];
  const tracks = new Map();
  let isHeader = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      columns = parseCSVLine(line, ",");
      isHeader = false;
      continue;
    }

    const values = parseCSVLine(line, ",");
    if (values.length < columns.length) continue;

    const obj = {};
    columns.forEach((c, i) => (obj[c] = values[i]));

    const title = (obj.name || "").toLowerCase().trim();
    const trackId = obj.id || "";

    let artistList = [];
    try {
      artistList = JSON.parse(obj.artists.replace(/'/g, "\""));
    } catch {
      artistList = [];
    }

    for (const artist of artistList) {
      const key = `${title}||${artist.toLowerCase().trim()}`;
      if (!tracks.has(key)) tracks.set(key, trackId);
    }
  }

  console.log("Dataset1 loaded:", tracks.size, "tracks");
  return tracks;
}

async function loadDataset2(path) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream });

  let columns = [];
  const tracks = new Map();
  let isHeader = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      columns = parseCSVLine(line, ",");
      isHeader = false;
      continue;
    }

    const values = parseCSVLine(line, ",");
    if (values.length < columns.length) continue;

    const obj = {};
    columns.forEach((c, i) => (obj[c] = values[i]));

    const title = (obj.track_name || "").toLowerCase().trim();
    const artistsRaw = (obj.artists || "").trim();
    const trackId = obj.track_id || "";

    const artistList = artistsRaw.split(";").map(a => a.toLowerCase().trim());

    for (const artist of artistList) {
      const key = `${title}||${artist}`;
      if (!tracks.has(key)) tracks.set(key, trackId);
    }
  }

  console.log("Dataset2 loaded:", tracks.size, "tracks");
  return tracks;
}

async function loadPopularSongs(path) {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream });

  let columns = [];
  const songs = [];
  let isHeader = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      columns = parseCSVLine(line, ";");
      isHeader = false;
      continue;
    }

    const values = parseCSVLine(line, ";");
    if (values.length < columns.length) continue;

    const obj = {};
    columns.forEach((c, i) => (obj[c] = values[i]));
    songs.push(obj);
  }

  console.log("Popular songs loaded:", songs.length, "songs");
  return songs;
}

async function merge() {
  const dataset1 = await loadDataset1(dataset1_path);
  const dataset2 = await loadDataset2(dataset1_2_path);
  const popularSongs = await loadPopularSongs(dataset2_path);

  console.log("Matching songs…");

  const output = [];
  output.push("title,artist,id");

  for (const song of popularSongs) {
    const title = (song.title || "").toLowerCase().trim();
    const artist = (song.artist || "").toLowerCase().trim();
    const key = `${title}||${artist}`;

    const trackId = dataset1.get(key) || dataset2.get(key) || "NOT_FOUND";
    output.push(`${song.title},${song.artist},${trackId}`);
  }

  fs.writeFileSync(output_path, output.join("\n"));
  console.log("Done! Saved to", output_path);
}

merge();
