# Music

Put the game's background tracks here (mp3 or m4a), then list them in `index.html`
near the top, under CONFIG:

```js
const MUSIC_TRACKS = [
  'music/rainy-afternoon.mp3',
  'music/chalk-dust.mp3',
];
```

They play shuffled with a soft crossfade. The ♪ button (game header and home page)
turns them on and off; it only appears once the list has at least one track.
Keep files around 2–5 MB each (128–192 kbps mp3 is plenty) and only use tracks you
have the rights to.
