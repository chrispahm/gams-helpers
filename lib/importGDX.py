import gdxpds
import sys

gdx_file = sys.argv[1]
dataframes = gdxpds.to_dataframes(gdx_file)
for symbol_name, df in dataframes.items():
    print(df.to_csv())
sys.exit()
