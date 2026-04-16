const Applet = imports.ui.applet;
const St = imports.gi.St;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

const CHECK_TIME = [20, 50];
const CHECK_BUFFER = 4;

class MetarApplet extends Applet.TextApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        
        this.set_applet_label("METAR: Loading...");
        this.set_applet_tooltip("");
        
        this.setupScheduler();
    }
    
    setupScheduler() {
        this.checkAndRunMetar();
        // Check every minute
        Mainloop.timeout_add_seconds(60, () => {
            this.checkAndRunMetar();
            return true;
        });
    }
    
    checkAndRunMetar() {
        const now = new Date();
        const minutes = now.getMinutes() - CHECK_BUFFER;
        
        if (minutes in CHECK_TIME) {
            this.runMetar();
        }
    }
    
    runMetar() {
        try {
            let [success, stdout, stderr, exitCode] = GLib.spawn_command_line_sync("metar EKRK");
            
            if (success) {
                const output = stdout.toString().trim();
                // Extract just the station code and key info
                const lines = output.split('\n');
                const metarLine = lines[0] || output;
                
                // Truncate if too long for taskbar
                let displayText = metarLine.substring(0, 50);
                if (metarLine.length > 50) {
                    displayText += "...";
                }
                
                this.set_applet_label(displayText);
                this.set_applet_tooltip(output);
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
