Act as a Senior WebOS Developer specializing in the Enact Framework (Sandstone UI).

I need you to generate the initial source code for an IPTV application based on the file structure provided in the context.

### Project Context
- **Framework**: Enact (React-based) with Sandstone UI library.
- **Platform**: LG WebOS (Targeting webOS 6.0+, but compatible with 4.5+).
- **Data Source**: A custom Cloudflare Pages mirror (`https://iptv-mirror.pages.dev`).
- **Persistence**: LocalStorage.
- **structure**: 
    ├── package.json
    ├── package-lock.json
    ├── README.md
    ├── resources
    │   └── ilibmanifest.json
    ├── src
    │   ├── App
    │   │   ├── App.module.less
    │   │   ├── App.tsx
    │   │   ├── attachErrorHandler.js
    │   │   └── package.json
    │   ├── components
    │   │   └── README.md
    │   ├── index.tsx
    │   ├── reportWebVitals.ts
    │   └── views
    │       ├── MainPanel.tsx
    │       └── README.md
    ├── tsconfig.json
    └── types
        └── react-app-env.d.ts



### Core Architecture
The app revolves around a "Tiered Playlist" system. It does not load all channels at once. It loads them in stages based on user interaction.

**State Variables (Store in a Context or Top-level State):**
1.  `playlist`: Array of channel objects.
2.  `currentIndex`: Integer.
3.  `tier`: Enum ('COUNTRY', 'LANGUAGE', 'GLOBAL').
4.  `userMeta`: Object { countryCode: string, langCode: string }.

### Functional Requirements

#### 1. Initialization (App.tsx / MainPanel.tsx)
On mount:
- Check `localStorage` for user metadata.
- If missing, fetch `https://ipapi.co/json/`.
- Parse response:
    - Extract `country` (e.g., "PE").
    - Extract `languages` (e.g., "es-PE,qu,ay"). SPLIT this string and take the first two letters of the first item (e.g., "es") to determine the primary language group.
    - Extract the languages string. Pass the primary language to a `normalizeLangCode` utility that converts ISO 639-1 (e.g., "es") to the ISO 639-2/3 (e.g., "spa") required by the iptv-mirror endpoints.
    - Store normalized { country: "PE", language: "spa" } in the application state.
- **Initial Fetch**: Request `https://iptv-mirror.pages.dev/countries/{countryCode}.json`.
- Populate `playlist` and auto-play index 0.

#### 2. The Video Player
- Use the Enact `VideoPlayer` component from `@enact/sandstone/VideoPlayer`.
- It must handle the `source` dynamically changing without unmounting the component (to prevent flicker).
- Implement a buffering system to ensure the stream remains stable and without stutter, as well as a spinner when it does buffer.
- **Filter**: Discard any channel where `iptv_urls` array is empty.

#### 3. Navigation & Expansion Logic (The Critical Path)
Map the Remote Control "Up" and "Down" arrows:

- **Up**: `currentIndex + 1`
- **Down**: `currentIndex - 1`

**Boundary Logic (The "Expansion" System):**
When `currentIndex` exceeds `playlist.length`:
1.  If `tier` is 'COUNTRY':
    - Switch `tier` to 'LANGUAGE'.
    - IDENTIFY neighbor countries. *[Constraint: Since no API exists for this, implement a helper function `getCountriesByLang(langCode)` that returns a hardcoded array of country codes for 'spa', etc.]*
    - Fetch `.../countries/{code}.json` for each neighbor.
    - Append results to `playlist`.
2.  If `tier` is 'LANGUAGE':
    - Switch `tier` to 'GLOBAL'.
    - Fetch `https://iptv-mirror.pages.dev/countries_metadata.json` to get ALL country codes.
    - Fetch the remaining countries lazily (in chunks) as the user scrolls.

#### 4. The UI Overlay (Floating Menu)
- Map the **BLUE** button on the remote to toggle a `Popup` or `Drawer`.
- **Menu Structure**:
    - here a quick representation of the different paths this ui will render: all-channels > [{countryCode} channels + channels from same language speaking countries + rest], categories > subcategories > [{countryCode} channels + channels from same language speaking countries + rest], countries > country > [{countryCode} channels + channels from same language speaking countries + rest]
    - **All Channels**: Displays the current `playlist`.
    - **Categories**: Since no API exists, hardcode: ['news', 'movies', 'music', 'kids', 'sport', 'documentary']. Fetch `.../categories/{slug}.json`.
    - **Countries**: Fetch `countries_metadata.json` to list only those that have `hasChannels` set to `true`.
- **Behavior**: Selecting a channel from the menu updates `currentIndex` and closes the menu.

#### 5. Numeric Input
- Listen for number keys (0-9).
- Buffer input (debounce 1s).
- Jump to `input_number - 1`.
- If target index > `playlist.length`, trigger the Expansion Logic (Tier 1 -> Tier 2) immediately to find the channel.

### Data Schemas

**IPAPI Response** (https://ipapi.co/json/):
```json
{ "country": "PE", "languages": "es-PE,qu,ay",... }
```

**Channel Object**:
```json
{
    "nanoid": "ZgQ9XQCbJsGM3Q",
    "name": " YTN",
    "iptv_urls": [],
    "youtube_urls": [
      "https://www.youtube-nocookie.com/embed/FJfwehhzIhw"
    ],
    "language": "kor",
    "country": "kr",
    "isGeoBlocked": false
}
```

**Country Object**:
```json
  "AD": {
    "country": "Andorra",
    "capital": "Andorra la Vella",
    "timeZone": "Europe/Andorra",
    "hasChannels": true
  },
```


### Output Requirements
Generate the code for these files specifically:
1.  `src/App/App.tsx` (Root logic, context providers).
2.  `src/views/MainPanel.tsx` (Player and Key handling).
3.  `src/utils/api.ts` (Fetch logic and URL construction).
4.  `src/utils/expansionLogic.ts` (The tiered loading state machine).

Ensure you use proper TypeScript interfaces. Use `@enact/core/handle` for key mapping if applicable, or standard `onKeyDown` events on the MainPanel.
```
