/*
KOTL modular desktop companion - PARAMETRIC STARTER MODEL
Units: mm
Status: concept/prototype geometry, NOT production-ready.
Open with OpenSCAD. Render (F6), inspect, then export each module separately
by setting PART to one of: "head_front", "head_rear", "body", "base",
"battery_tray", "speaker_chamber", "display_cradle".
Important: verify all component dimensions, connector locations, acoustic volume,
clearances, wall thicknesses, and fasteners before printing.
*/

PART = "assembly"; // [assembly,head_front,head_rear,body,base,battery_tray,speaker_chamber,display_cradle]

$fn = 96;

// -------- Global parameters --------
wall = 2.5;
fit_clearance = 0.35;       // initial FDM fit allowance; calibrate with test coupon
head_w = 78;
head_h = 76;
head_d = 48;

// Battery envelope requires 84 x 24 x 22 mm INCLUDING wires/bends.
// A 90 mm outside width with 2.5 mm sidewalls leaves only 85 mm internal width.
// Recommended starting width increased to 96 mm to allow sliding clearance.
body_w = 96;                // proposed revision; 90 mm is very tight for 84 mm envelope
body_h = 72;
body_d = 58;
base_w = body_w;
base_h = 33;
base_d = body_d;

display_pcb_w = 38;
display_pcb_h = 35.6;
display_pcb_t = 3.5;
display_aperture = 33.5;
display_tilt = 15;

mic_hole_d = 2;
mic_board = 14;
mic_board_t = 3;

speaker_d = 28;
speaker_depth = 11.5;
speaker_lip_d = 28.5;
speaker_groove_depth = 1.5;
speaker_grille_d = 24;
speaker_chamber_depth = 21;
// A 20 cm^3 chamber over 21 mm depth needs ~952 mm^2 cross-sectional area.
// Circular equivalent diameter ~34.8 mm. Final shape/volume must be measured.

esp32_l = 51.5;
esp32_w = 28.5;
esp32_h = 12;
esp32_hole_d = 2.7;         // nominal clearance for M2.5; verify board holes
m3_clear = 3.3;
boss_od = 6.0;

battery_l = 84;
battery_w = 24;
battery_h = 22;

usb_cut_w = 9.2;
usb_cut_h = 3.6;
switch_cut_w = 13.0;        // placeholder: measure actual SS-12D00 body/actuator
switch_cut_h = 6.0;         // placeholder: measure actual SS-12D00 body/actuator

// -------- Helper geometry --------
module rounded_box(size=[10,10,10], r=4) {
    // Rounded rectangular solid, centered in X/Y, bottom at Z=0.
    hull() {
        for (x=[-size[0]/2+r, size[0]/2-r])
            for (y=[-size[1]/2+r, size[1]/2-r])
                translate([x,y,0]) cylinder(h=size[2], r=r);
    }
}

module hollow_rounded_box(size=[10,10,10], r=4, w=wall) {
    difference() {
        rounded_box(size,r);
        translate([0,0,w])
            rounded_box([size[0]-2*w,size[1]-2*w,size[2]], max(0.8,r-w));
    }
}

module m3_boss(h=8) {
    difference() {
        cylinder(h=h,d=boss_od);
        translate([0,0,-0.1]) cylinder(h=h+0.2,d=m3_clear);
    }
}

module head_front() {
    // Front bezel plate oriented with front along -Y. Display aperture centered.
    difference() {
        rounded_box([head_w, 4.0, head_h], r=18);
        translate([0,0,2]) rotate([90,0,0])
            cylinder(h=10,d=display_aperture,center=true);
        // Rear relief pocket for PCB; intentionally generous concept pocket.
        translate([0,1.0,0])
            cube([display_pcb_w+2*fit_clearance, 5, display_pcb_h+2*fit_clearance],center=true);
    }
}

module head_rear() {
    // Shallow head shell, open at front (-Y); internal supports are placeholders.
    difference() {
        translate([0,0,0]) rounded_box([head_w,head_d,head_h],r=18);
        translate([0,wall,wall])
            rounded_box([head_w-2*wall,head_d-2*wall,head_h-2*wall],r=15.5);
        // front opening
        translate([0,-head_d/2+wall,head_h/2])
            cube([head_w-2*wall,wall*2,head_h-2*wall],center=true);
        // chin mic port: location provisional
        translate([0,-head_d/2-0.1,12])
            rotate([90,0,0]) cylinder(h=wall+1,d=mic_hole_d);
    }
    // display support pads: positions need matching to actual PCB/mount holes
    for (x=[-16,16], z=[-14,14])
        translate([x, -head_d/2+wall+3, head_h/2+z]) rotate([90,0,0]) m3_boss(4);
    // top button placeholder aperture (switch/actuator needs measured geometry)
    difference() {
        translate([0,0,head_h-1]) cube([14,14,2],center=true);
        translate([0,0,head_h-1]) cylinder(h=4,d=4,center=true);
    }
}

module display_cradle() {
    // Angled cradle concept; confirm tilt axis/orientation in actual assembly.
    rotate([display_tilt,0,0])
    difference() {
        rounded_box([display_pcb_w+6, 4, display_pcb_h+6],r=3);
        cube([display_pcb_w+2*fit_clearance, 5, display_pcb_h+2*fit_clearance],center=true);
    }
}

module speaker_chamber() {
    // Standalone chamber: nominal 36 x 27 x 21 mm internal target is ~20.4 cm^3
    // before speaker intrusion / grille / lip details. Verify volume in CAD.
    chamber_x = 36;
    chamber_y = 27;
    chamber_z = speaker_chamber_depth;
    difference() {
        rounded_box([chamber_x+2*wall,chamber_y+2*wall,chamber_z+wall],r=5);
        translate([0,0,wall])
            rounded_box([chamber_x,chamber_y,chamber_z+0.2],r=2.5);
        // front opening and mounting groove represented as front aperture
        translate([0,-(chamber_y/2+wall+0.1),chamber_z/2+wall])
            rotate([90,0,0]) cylinder(h=wall+1,d=speaker_grille_d);
    }
    // speaker lip ring concept on front plane
    translate([0,-(chamber_y/2+wall),chamber_z/2+wall])
    difference() {
        rotate([90,0,0]) cylinder(h=1.5,d=speaker_lip_d);
        rotate([90,0,0]) cylinder(h=1.6,d=speaker_d);
    }
}

module body_shell() {
    // Main torso shell with open underside for assembly.
    difference() {
        rounded_box([body_w,body_d,body_h],r=18);
        translate([0,0,wall])
            rounded_box([body_w-2*wall,body_d-2*wall,body_h],r=15.5);
        // neck/head interface opening, centered on top
        translate([0,0,body_h-wall/2])
            cylinder(h=wall+2,d=32,center=true);
        // speaker front sound path opening at front (-Y), provisional position
        translate([0,-body_d/2-0.1,body_h*0.58])
            rotate([90,0,0]) cylinder(h=wall+1,d=speaker_grille_d);
        // rear service opening
        translate([0,body_d/2+0.1,body_h*0.48])
            cube([body_w-22,wall+1,body_h*0.55],center=true);
    }

    // Vertical ESP32 mounting bosses - positions are placeholders until hole pattern measured.
    for (x=[-17,17], z=[-20,20])
        translate([x,0,body_h/2+z]) rotate([90,0,0]) m3_boss(5);
}

module battery_tray() {
    // Tray cavity dimensions include the requested wire/terminal envelope plus fit allowance.
    tray_l = battery_l + 2*fit_clearance;
    tray_w = battery_w + 2*fit_clearance;
    tray_h = battery_h + 2*fit_clearance;
    difference() {
        rounded_box([tray_l+2*wall,tray_w+2*wall,3],r=3);
        translate([0,0,wall])
            cube([tray_l,tray_w,3],center=true);
    }
    // low retaining rails along long edges
    for (y=[-(tray_w/2+wall/2), tray_w/2+wall/2])
        translate([0,y,3]) cube([tray_l,wall,5],center=true);
}

module base_shell() {
    // Base cover with tray region; battery tray may be oriented along X (84 mm).
    difference() {
        rounded_box([base_w,base_d,base_h],r=8);
        translate([0,0,wall])
            rounded_box([base_w-2*wall,base_d-2*wall,base_h],r=5.5);
        // USB-C rear cutout on +Y wall. Verify board alignment before finalizing.
        translate([0,base_d/2+0.1,base_h*0.58])
            cube([usb_cut_w,wall+1,usb_cut_h],center=true);
        // power switch placeholder on rear panel
        translate([base_w*0.27,base_d/2+0.1,base_h*0.58])
            cube([switch_cut_w,wall+1,switch_cut_h],center=true);
        // 4 ventilation slots, side walls. Do not place slots into battery pocket;
        // validate cell manufacturer's thermal and charging requirements.
        for (x=[-1.5, -0.5, 0.5, 1.5])
            translate([base_w/2+0.1, x*5, base_h*0.55])
                cube([wall+1,2,12],center=true);
    }
    // base screw bosses
    for (x=[-base_w/2+8,base_w/2-8], y=[-base_d/2+8,base_d/2-8])
        translate([x,y,wall]) m3_boss(7);
}

module assembly_preview() {
    // Exploded-ish preview; components are illustrative and not mechanically assembled.
    color("white") translate([0,0,base_h+body_h+5]) head_rear();
    color("tomato") translate([0,0,base_h+2]) body_shell();
    color("dimgray") base_shell();
    color("silver") translate([0,0,base_h+8]) speaker_chamber();
    color("orange") translate([0,0,wall+2]) battery_tray();
}

// -------- Part selector --------
if (PART=="assembly") assembly_preview();
else if (PART=="head_front") head_front();
else if (PART=="head_rear") head_rear();
else if (PART=="body") body_shell();
else if (PART=="base") base_shell();
else if (PART=="battery_tray") battery_tray();
else if (PART=="speaker_chamber") speaker_chamber();
else if (PART=="display_cradle") display_cradle();
