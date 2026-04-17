#!/bin/bash
mkdir -p /.local/share/cinnamon/applets/metar_applet@local
cp -r applet.js ~/.local/share/cinnamon/applets/metar_applet@local/applet.js
cp -r metadata.json ~/.local/share/cinnamon/applets/metar_applet@local/metadata.json
cp -r settings-schema.json ~/.local/share/cinnamon/applets/metar_applet@local/settings-schema.json

mkdir -p ~/.local/share/cinnamon/applets/metar_applet@local/util
cp -a util/. ~/.local/share/cinnamon/applets/metar_applet@local/util/