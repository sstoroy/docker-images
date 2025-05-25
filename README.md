# Archives and packages webpage

Built with [Eleventy ](https://www.11ty.dev) and [Tailwind CSS](https://tailwindcss.com).

Design based on [my resume](https://sstoroy.github.io/resume).

## How to use

1. Create a folder under `/src/_data/`for your application. Give the application folder a name that works on all devices (so no spaces or funny symbols), like `my_awesome_application`.

2. In that folder, create a file `info.txt`. The first line of that folder contains the proper name of the application, like `My 😄Awesome⚡ Application!`. This line is obligatory, as the script will skip any and all archives belonging to the application if you don't write something here.

3. The second line in `info.txt` is optional, but if set, it must be a link to the source code of the project.

4. Still in the folder, create a subfolder for each version of the application.

5. For each version subfolder, create a folder to determine the preparation for the files (see [Types of archives](#types-of-archives)). Store the relevant files there. 

When starting the server, the script will create an archive folder under `/dist/assets/` where it stores the created archives. The script also outputs information and/or errors in the console log with the prefix `[FileStager]`.

### Types of archives

- `file`: Exports a single file (the first one the script finds in the folder). Typically already archived files, packages or plain executables.
- `archive`: Creates an archive with the files.
- `docker`: Creates an archive with the files required for Docker, including scripts for Windows and Linux. Must contain a Dockerfile.
- `windows`: Creates an archive file with the files and add the suffix 'Windows' to the file.
- `linux`: Creates an archive file with the files and add the suffix 'Linux' to the file.