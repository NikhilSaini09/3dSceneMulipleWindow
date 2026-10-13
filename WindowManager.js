class WindowManager {
    #windows;
    #count;
    #id;
    #winData;
    #winShapeChangeCallback;
    #winChangeCallback;

    constructor() {
        this.#windows = [];
        this.#count = 0;

        // event listener for when local storage is changed from other window/tab
        window.addEventListener("storage", (event) =>{
            if (event.key == "windows" && event.newValue) {
                try {
                    let newWindows = JSON.parse(event.newValue);
                    let winChange = this.#didWindowsChange(this.#windows, newWindows);

                    this.#windows = newWindows;

                    if (winChange) {
                        if(this.#winChangeCallback) this.#winChangeCallback();
                    }
                } catch (e) {
                    console.error("Failed to parse windows from storage event:", e);
                }
            }
        });

        // event listener for when current window is about to be closed
        window.addEventListener("beforeunload", ()=> {
            let index = this.getWindowIndexFromId(this.#id);
            if (index !== -1) {
                this.#windows.splice(index, 1);
                this.updateWindowsLocalStorage();
            }
        });
    }

    init(metaData) {
        this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
        this.#count = parseInt(localStorage.getItem("count") || "0", 10);
        this.#count++;
        this.#id = this.#count;
        
        let shape = this.getWinShape();
        this.#winData = {id: this.#id, shape: shape, metaData: metaData};
        this.#windows.push(this.#winData);

        localStorage.setItem("count", this.#count);
        this.updateWindowsLocalStorage();
    }

    updateWindowsLocalStorage() {
        localStorage.setItem("windows", JSON.stringify(this.#windows));
    }

    getWinShape() {
        let shape = {x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight}
        return shape;
    }

    getWindowIndexFromId(id) {
        let index = -1;

        for (let i=0; i<this.#windows.length; i++) {
            if (this.#windows[i].id == id) {
                index = i;
                break;
            }
        }
        return index;
    }

    #didWindowsChange(prevWins, newWins) {
        if (!prevWins || !newWins) return true;
        if (prevWins.length != newWins.length) return true;
        for (let i = 0; i < prevWins.length; i++) {
            if (prevWins[i].id !== newWins[i].id) return true;
            if (JSON.stringify(prevWins[i].metaData) !== JSON.stringify(newWins[i].metaData)) return true;
        }
        return false;
    }

    setMetaData(metaData) {
        this.#winData.metaData = metaData;
        let index = this.getWindowIndexFromId(this.#id);
        if (index !== -1) {
            this.#windows[index].metaData = metaData;
            this.updateWindowsLocalStorage();
        }
    }

    update() {
        let curShape = this.getWinShape();

        if (curShape.x != this.#winData.shape.x ||
			curShape.y != this.#winData.shape.y ||
			curShape.w != this.#winData.shape.w ||
			curShape.h != this.#winData.shape.h) 
        {
            this.#winData.shape = curShape;

            let index = this.getWindowIndexFromId(this.#id);
            this.#windows[index].shape = curShape;

            if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
            this.updateWindowsLocalStorage();
        }
    }

    setWinShapeChangeCallback(callback) {
        this.#winShapeChangeCallback = callback;
    }

    setWinChangeCallback(callback) {
        this.#winChangeCallback = callback;
    }

    getWindows() {
        return this.#windows;
    }

    getThisWindowData() {
        return this.#winData;
    }

    getThisWindowID() {
        return this.#id;
    }
}

export default WindowManager;
