const Applet = imports.ui.applet;
const St = imports.gi.St;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Settings = imports.ui.settings;

// Custom imports
const { isValidICAO } = require('./util/icaovalidator');

const CHECK_TIME = [20, 50];
const CHECK_BUFFER = 4;
const AD_ICAO_PROP = "AD_ICAO";
const LINE_LENGTH_PROP = "LINE_LENGTH";

class MetarApplet extends Applet.TextApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        this.setupSettings(metadata["uuid"], instanceId);
        
        this.set_applet_label("METAR: Loading...");
        this.set_applet_tooltip("");
        
        this.runMetar();
        this.setupScheduler();
    }

    setupSettings(uuid, instanceId) {
        this.settings = new Settings.AppletSettings(this, uuid, instanceId);
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            AD_ICAO_PROP,
            AD_ICAO_PROP,
            this.validateIcaoAndRun
        );
        this.settings.bindProperty(
            Settings.BindingDirection.IN,
            LINE_LENGTH_PROP,
            LINE_LENGTH_PROP,
            this.formatMetar
        );
    }
    
    setupScheduler() {
        const delaySeconds = this.getTimeBeforeNextUpdate();
        Mainloop.timeout_add_seconds(delaySeconds, () => {
            this.runMetar();            
            this.scheduleNextUpdate();
            return false; // No repeat for the initial delay
        });
    }

    getTimeBeforeNextUpdate() {
        const minutes = new Date().getUTCMinutes() - CHECK_BUFFER;
        const diffToMinutes = CHECK_TIME
            .map(t => (60+t-minutes)%60)
            .filter(v => v > 0);
        return Math.min.apply(null, diffToMinutes) * 60;
    }

    scheduleNextUpdate() {
        Mainloop.timeout_add_seconds(this.getTimeBeforeNextUpdate(), () => {
            this.runMetar();
            return true; // Repeat
        });
    }
    
    checkAndRunMetar() {
        const now = new Date();
        const minutes = now.getUTCMinutes() - CHECK_BUFFER;

        if (CHECK_TIME.includes(minutes) || this.firstExecution) {
            this.runMetar();
            this.firstExecution = false;
        }
    }

    validateIcaoAndRun(id){
        if(!isValidICAO(id)) return;
        this.runMetar();
    }
    
    runMetar() {
        try {
            let [success, stdout, stderr, exitCode] = GLib.spawn_command_line_sync("metar "+this.AD_ICAO);
            
            if (success) {
                const output = stdout.toString().trim();
                const lines = output.split('\n');
                this.metarLine = lines[0] || output;
                this.formatMetar();
                
                const now = new Date();
                const hour = now.getUTCHours() < 10 ? "0" + now.getUTCHours() : now.getUTCHours().toString();
                const minutes = now.getUTCMinutes() < 10 ? "0" + now.getUTCMinutes() : now.getUTCMinutes().toString();
                this.set_applet_tooltip("Last checked at "+hour+minutes+"Z - Click to update now.\n"+this.metarLine);
            } else {
                this.set_applet_label("METAR: Error");
                this.set_applet_tooltip("Failed to fetch METAR data");
            }
        } catch (e) {
            this.set_applet_label("METAR: Error");
            this.set_applet_tooltip("Error running metar command: " + e.message);
        }
    }

    formatMetar() {
        let displayText = this.metarLine.substring(0, this.LINE_LENGTH);
        if (this.metarLine.length > this.LINE_LENGTH) {
            const lastSpaceIndex = this.metarLine.substring(0, this.LINE_LENGTH).lastIndexOf(" ");
            displayText = this.metarLine.substring(0, lastSpaceIndex);
            displayText += "\n";
            displayText += this.metarLine.substring(lastSpaceIndex+1, 2 * this.LINE_LENGTH);
            if (this.metarLine.length > 2 * this.LINE_LENGTH) displayText += "...";
        }
        this.set_applet_label(displayText);
    }
    
    on_applet_clicked() {
        // Re-run METAR on click
        this.runMetar();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new MetarApplet(metadata, orientation, panelHeight, instanceId);
}
