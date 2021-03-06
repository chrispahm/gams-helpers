# GAMS-Helpers
GAMS-Helper functions, mainly consumed by the [linter-gams](https://github.com/chrispahm/linter-gams) package.

### Run
Run the GAMS model by pressing ```shift-enter``` or clicking ```GAMS-Helpers: Run``` in the command palette.
This will automatically open the listing file once finished.

### Check
If you would like to output a parameter/variable/set at a given position just press "c" at that position (where you would usually place your ```abort``` statement) and then auto-complete the snippet by pressing tab.
Now fill in the desired parameter/varaible/set name you would like to output and hit ```alt-shift-enter``` or ```GAMS-Helpers: Check```. A web-browser window will be openend where you can inspect your parameter/set/variable.


## Installation
You can install through the CLI by doing:

```
$ apm install gams-helpers
```

Or you can install from Settings view by searching for `gams-helpers`.
