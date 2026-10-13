# Multiple Windows 3D Scene

Live at: https://nikhilsaini09.github.io/3dSceneMulipleWindow/

An interactive Three.js 3D scene synchronized in real-time across multiple browser windows and monitors using HTML5 `localStorage` and window coordinate tracking.

As you move, resize, or open new browser windows, each window functions as a distinct spatial viewport into a shared 3D universe. Each window anchors its own animated 3D geometry that smoothly tracks its position relative to other windows on your desktop.

---

## Features

* **Multi-Window Spatial Synchronization:** Windows communicate their screen coordinates in real time. Objects align seamlessly across screens and desktop boundaries.
* **6 Switchable 3D Wireframe Animations:**
  1. 🍩 **Breathing Torus:** Classic wireframe torus with harmonic breathing pulsation.
  2. 🌀 **Cosmic Torus Knot:** Intertwined ribbon loop rotating smoothly across 3 axes.
  3. 🌐 **Geodesic Dual Orb:** Icosahedral outer cage housing an independently spinning core.
  4. 🧊 **Quantum Hypercube:** Nested dual tesseract boxes counter-rotating along diagonal axes.
  5. 🪐 **Gyroscopic Astrolabe:** 3 concentric gimbal rings spinning on orthogonal axes (pitch, roll, yaw).
  6. 💎 **Crystal Dodecahedron:** 12-sided faceted crystal prism tumbling and undulating.
* **Per-Window Independent Switching:** Click near the center of any window to cycle its shape. All other connected windows instantly reflect that window's updated shape in real time.
* **Dual Three.js Loading:** Uses local `threeR124_MINI_lib.js` for fast offline loading, with dynamic fallback to jsDelivr CDN.
* **Clean State Management:** Easy reset mechanism for ghost windows via `?clear` parameter or pressing the `C` key.

---

## Quick Start

Because modern browsers block ES Modules (`<script type="module">`) over the `file://` protocol due to CORS security rules, this project must be served through a local HTTP server.

### 1. Start a Local Server

From the project directory, run any of the following:

**Using Python (pre-installed on most systems):**

```bash
python3 -m http.server 8000
```

*(On Windows: `python -m http.server 8000`)*

**Using Node.js:**

```bash
npx serve -l 8000
```

*(or use the VS Code **Live Server** extension)*

### 2. Open Multiple Windows

1. Navigate to `http://localhost:8000` in your browser.
2. Press `Ctrl + N` (or `Cmd + N` on macOS) to open a **second browser window** (make sure it's a separate window, not just a tab).
3. Navigate the second window to `http://localhost:8000`.
4. Position the windows side-by-side or across multiple monitors and drag them around!

---

## Controls & Shortcuts

| Action | Control | Description |
| :--- | :--- | :--- |
| **Switch Animation** | **Click near center** | Cycles the 3D shape for the clicked window. |
| **Next Animation** | **`Space`** or **`→`** (Right Arrow) | Switches to the next animation style. |
| **Previous Animation** | **`←`** (Left Arrow) | Switches to the previous animation style. |
| **Direct Selection** | **Keys `1` – `6`** | Directly select animations 1 through 6. |
| **Reset Stale Windows** | **`C`** key or append `?clear` | Clears `localStorage` and resets ghost window data. |

---

## How It Works

### 1. Cross-Window Communication (`WindowManager.js`)

* Each window assigns itself a unique ID and registers its position in `localStorage` under the key `"windows"`:

  ```json
  [
    {
      "id": 1,
      "shape": { "x": 100, "y": 200, "w": 800, "h": 600 },
      "metaData": { "animIndex": 0 }
    }
  ]
  ```

* Whenever any window moves or changes shape, it updates `localStorage`.
* Other windows listen via the native `window.addEventListener("storage", ...)` event, which fires across all windows sharing the same origin.

### 2. Spatial Coordinate Projection (`main.js`)

* An `OrthographicCamera` covers the window's viewport (`left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight`).
* The scene root (`world`) is offset by the inverse of the current window's screen coordinate:
  $$\text{world.position} = (-\text{screenX}, -\text{screenY})$$
* Each window's geometry is placed at its absolute desktop coordinate:
  $$\text{geometry.position} = (\text{win.x} + \frac{\text{win.w}}{2}, \text{win.y} + \frac{\text{win.h}}{2})$$
* Because the current window's coordinate cancels out:
  $$(-\text{screenX}) + (\text{screenX} + \frac{w}{2}) = \frac{w}{2}$$
  The current window's shape is always centered, while other windows' shapes appear at their true relative physical distance!

---

## Operating System Compatibility

### Windows & macOS (100% Native)

* **Windows Desktop Window Manager (DWM)** natively broadcasts global desktop coordinates (`window.screenX`, `window.screenY`) across single and multi-monitor setups.
* Works seamlessly out of the box in Chrome, Brave, Edge, Firefox, and Safari.

### Linux (Ubuntu / GNOME / Other distros)

* **X11 / Xorg Sessions:** Works out of the box. Coordinates track smoothly across monitors.
* **Wayland Sessions:** The Wayland display protocol intentionally restricts applications from querying their global screen coordinates for security/isolation purposes (`screenX` and `screenY` return static values like `0, 0` or `3, 5`).
  * *To run on Ubuntu Linux with full coordinate tracking:* Log out, click the gear icon (⚙️) on the login screen, select **"Ubuntu on Xorg"**, and log in.

---

## Project Structure

```bash
├── index.html              # Main HTML entry with styling and minimalist HUD
├── main.js                 # Three.js scene setup, animation render loop, and controls
├── WindowManager.js        # Multi-window state management via localStorage
├── threeR124_MINI_lib.js   # Local Three.js r124 bundle (offline support)
├── .gitattributes          # Line-ending normalization (LF) across Windows & Linux
└── README.md               # Project documentation
```

---

## Credits & License

Inspired by the original multi-window 3D experiment created by [Bjørn Staal (`@bgstaal`)](https://github.com/bgstaal/multipleWindow3dScene).
Released under the MIT License.
