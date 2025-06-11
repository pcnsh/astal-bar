import { App } from "astal/gtk3"
import { Variable, GLib, bind, exec} from "astal"
import { Astal, Gtk, Gdk } from "astal/gtk3"

import Mpris from "gi://AstalMpris"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"

import Popover from "./Popover.tsx"


function SysTray() {
    const tray = Tray.get_default()

    return <box className="SysTray">
        {bind(tray, "items").as(items => items.map(item => (
            <menubutton
                tooltipMarkup={bind(item, "tooltipMarkup")}
                usePopover={false}
                actionGroup={bind(item, "actionGroup").as(ag => ["dbusmenu", ag])}
                menuModel={bind(item, "menuModel")}>
                <icon gicon={bind(item, "gicon")} />
            </menubutton>
        )))}
    </box>
}

function Wifi() {
    const network = Network.get_default()
    const wifi = bind(network, "wifi")

                // tooltipText={bind(wifi, "ssid").as(String)}
    return <box className="Wifi" visible={wifi.as(Boolean)}>
        {wifi.as(wifi => wifi && (
            <label label={bind(wifi, "ssid").as(String)}/>
        ))}
        {wifi.as(wifi => wifi && (
            <icon
                icon={bind(wifi, "iconName")}
            />
        ))}
    </box>

}

function AudioSlider() {
    const speaker = Wp.get_default()?.audio.defaultSpeaker!

    return <box className="AudioSlider" css="min-width: 140px">
        <icon icon={bind(speaker, "volumeIcon")} />
        <slider
            hexpand
            onDragged={({ value }) => speaker.volume = value}
            value={bind(speaker, "volume")}
        />
    </box>
}

function BatteryLevel(props) {
    const bat = Battery.get_default()
    const visible = Variable(false);
    const mode = Variable(exec("powerprofilesctl get"))
    const _popover = <Popover
            className="Popup"
            onClose={() => visible.set(false)}
            visible={visible()}
            marginTop={40}
            marginRight={265}
            valign={Gtk.Align.START}
            halign={Gtk.Align.END}
    >
            <box className="popup" vertical>
                {/* maxWidthChars is needed to make wrap work */}
                <button onClicked={() => setBatMode(visible, mode, "performance")}>
                    <box>
                        performance
                        <label className="active" label={mode((value) => `${value == 'performance' ? '⚫' : ''}`)}/>
                    </box>
                </button>

                <button onClicked={() => setBatMode(visible, mode, "balanced")}>
                    <box>
                        balanced
                        <label className="active" label={mode((value) => `${value == 'balanced' ? '⚫' : ''}`)}/>
                    </box>
                </button>
                <button onClicked={() => setBatMode(visible, mode, "power-saver")}>
                    <box>
                        power-saver
                        <label className="active" label={mode((value) => `${value == 'power-saver' ? '⚫' : ''}`)}/>
                    </box>
                </button>
            </box>
    </Popover>

    return <box className="Battery"
        visible={bind(bat, "isPresent")}>
        <icon icon={bind(bat, "batteryIconName")} />
        <label label={bind(bat, "percentage").as(p =>
            `${Math.floor(p * 100)}`
        )} />
        <label  className={bind(bat, "state").as(s => `state-${s}`)} label={" ⚫ "} />
        <button className="PerfMode" onClicked={() => visible.set(true)} >
            <label label={mode()} />
        </button>
    </box>
}

function Media() {
    const mpris = Mpris.get_default()

    return <box className="Media">
        {bind(mpris, "players").as(ps => ps[0] ? (
            <box>
                <box
                    className="Cover"
                    valign={Gtk.Align.CENTER}
                    css={bind(ps[0], "coverArt").as(cover =>
                        `background-image: url('${cover}');`
                    )}
                />
                <label
                    label={bind(ps[0], "metadata").as(() =>
                        `${ps[0].title} - ${ps[0].artist}`
                    )}
                />
            </box>
        ) : (
            <label label="Nothing Playing" />
        ))}
    </box>
}

function Time({ format = "%H:%M - %A %e." }) {
    const time = Variable("").poll(1000, "date '+%d/%m %R'")

    return <label
        className="Time"
        onDestroy={() => time.drop()}
        label={time()}
    />
}

function getBatMode(mode, label) {
    if(mode.get() == label ) {
        return "⚫"
    }
    return ""
}

function setBatMode(visible, mode, label) {
    visible.set(false)
    if(label == "performance") {
        exec("powerprofilesctl set performance")
    }

    if(label == "balanced") {
        exec("powerprofilesctl set balanced")
    }

    if(label == "power-saver") {
        exec("powerprofilesctl set power-saver")

    }
    mode.set(label)
    // print(mode.get())

        // mode.set(label)
}

export default function Bar(monitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        className="Bar"
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}>
        <centerbox>
            <box  halign={Gtk.Align.START} >

                <Media />
            </box>
            <box/>
            <box  halign={Gtk.Align.END} >
                <SysTray />
                <Wifi />
                <BatteryLevel />
                <AudioSlider />
                <Time />
            </box>
        </centerbox>
    </window>
}
