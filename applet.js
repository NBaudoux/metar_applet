const Applet = imports.ui.applet;
const St = imports.gi.St;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Settings = imports.ui.settings;

// Custom imports
const { isValidICAO } = require('./util/icaovalidator');
const { formatMetar, formatZuluTime } = require('./util/formatter');

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
        const props = [
            {name: "AD_ICAO", onChanged: this.validateIcaoAndRun}, 
            {name: "LINE_LENGTH", onChanged: this.formatMetar},
            {name: "TWO_LINES", onChanged: this.formatMetar},
            {name: "OBSERVATION_TIMES", onChanged: this.setupScheduler}, 
            {name: "UPDATE_DELAY", onChanged: this.setupScheduler}, 
        ];

        this.settings = new Settings.AppletSettings(this, uuid, instanceId);
        props.forEach((prop) => {
            this.settings.bindProperty(
                Settings.BindingDirection.IN,
                prop.name,
                prop.name,
                prop.onChanged
            );
        })
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
                
                const zuluTime = formatZuluTime(new Date());
                this.set_applet_tooltip("Last checked at "+zuluTime+" - Click to update now.\n"+this.metarLine);
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
        this.set_applet_label(formatMetar(this.metarLine, this.LINE_LENGTH, this.TWO_LINES));
    }
    
    on_applet_clicked() {
        // Re-run METAR on click
        this.runMetar();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new MetarApplet(metadata, orientation, panelHeight, instanceId);
}
