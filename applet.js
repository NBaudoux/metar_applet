const Applet = imports.ui.applet;
const St = imports.gi.St;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

const CHECK_TIME = [20, 50];
const CHECK_BUFFER = 4;
const AD_ICAO = "EKRK"

class MetarApplet extends Applet.TextApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        
        this.set_applet_label("METAR: Loading...");
        this.set_applet_tooltip("");
        this.firstExecution = true
        
        this.setupScheduler();
    }
    
    setupScheduler() {
        this.checkAndRunMetar();
        const delaySeconds = this.getTimeBeforeNextUpdate();
        global.log("Next update in "+delaySeconds+" seconds");
        Mainloop.timeout_add_seconds(delaySeconds, () => {
            this.checkAndRunMetar();
            
            Mainloop.timeout_add_seconds(1800, () => {
                this.checkAndRunMetar();
                return true; // Repeat
            });
            
            return false; // No repeat for the initial
        });
    }

    getTimeBeforeNextUpdate() {
        const minutes = new Date().getUTCMinutes() - CHECK_BUFFER;
        return Math.min.apply(null, CHECK_TIME.map(t => (60+t-minutes)%60)) * 60;
    }
    
    checkAndRunMetar() {
        const now = new Date();
        const minutes = now.getUTCMinutes() - CHECK_BUFFER;

        if (CHECK_TIME.includes(minutes) || this.firstExecution) {
            this.runMetar();
            this.firstExecution = false;
        }
    }
    
    runMetar() {
        try {
            let [success, stdout, stderr, exitCode] = GLib.spawn_command_line_sync("metar "+AD_ICAO);
            
            if (success) {
                const output = stdout.toString().trim();
                const lines = output.split('\n');
                const metarLine = lines[0] || output;
                
                let displayText = metarLine.substring(0, 50);
                if (metarLine.length > 50) {
                    displayText += "...";
                }
                
                const now = new Date();
                const hour = now.getUTCHours() < 10 ? "0" + now.getUTCHours() : now.getUTCHours().toString();
                const minutes = now.getUTCMinutes() < 10 ? "0" + now.getUTCMinutes() : now.getUTCMinutes().toString();
                this.set_applet_label(displayText);
                this.set_applet_tooltip("Last checked at "+hour+minutes+"Z - Click to update now.");
            } else {
                this.set_applet_label("METAR: Error");
                this.set_applet_tooltip("Failed to fetch METAR data");
            }
        } catch (e) {
            this.set_applet_label("METAR: Error");
            this.set_applet_tooltip("Error running metar command: " + e.message);
        }
    }
    
    on_applet_clicked() {
        // Re-run METAR on click
        this.runMetar();
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new MetarApplet(metadata, orientation, panelHeight, instanceId);
}
