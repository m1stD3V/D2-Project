# D2 - Paint application (Mapcrafter)

Mapcrafter is a map-creation web software that allows GMs to easily create battlemaps. It is hosted at: https://m1std3v.github.io/D2-Project/. With access to the internet, simply visit this html site.

## Usage

Undo and Redo are buttons on the map and also keyed to z and y. Simply draw, assuming snapping to grid is intentional, and enjoy as the application automatically snaps it to typical dungeon tiles. Afterwards, stamp relativant tiles with custom stamps, such as doors and points of interest. After this, use the export to png button in the top right. If you're not finished, save to json and load it up later for future work.

## Local Installation

To use this application without an internet connection, download this project from github and open it on the local machine. Install deno if you haven't already. Open a terminal at the root of the folder, and run the command `deno task preview`. You may need to type `deno task setup`, then `deno task ci` if deno has not been setup on the project yet.

## Developer Instructions

In order to extend this project, you may create a new typescript document to govern that space or use the existing ones. For export and import functionality, go to IO.ts. Main.ts contains the meat of the project. grid.ts handles calculations of grid snapping. If one wanted to add functionality, for example the scaling of the drawn lines upon grid scaling, they would create a function in grid.ts to govern that process. Then they would reference it in main.ts during an appropriate event function. Classes and functions have been setup in such a way that implementation should be concise and restricted to one area of the code.

**Note: For IO branch work (Commits: 29b5427d, ab9b5ee7, 5517581f)**
_Referenced:_
-https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
-https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static
-https://developer.mozilla.org/en-US/docs/Web/API/Blob
-https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
-https://developer.mozilla.org/en-US/docs/Web/API/FileReader
-https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
