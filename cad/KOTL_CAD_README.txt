KOTL Parametric Starter CAD
===========================

Files
-----
KOTL_Parametric_Starter.scad : editable OpenSCAD starter geometry

Important status
----------------
This is a concept/starter model, not a verified manufacturing model and not a
final FreeCAD .FCStd file. It is intended to establish the part breakdown and
parameter names. Some mounting locations and switch dimensions are placeholders.

Open
----
1. Install OpenSCAD.
2. Open KOTL_Parametric_Starter.scad.
3. Set PART at the top to "assembly" for a preview, or select an individual
   part name (head_front, head_rear, body, base, battery_tray,
   speaker_chamber, display_cradle).
4. Press F6 to render.
5. Export each selected part as STL only after inspecting it and confirming
   geometry/units. Reopen each STL in your slicer and check scale.

Critical design checks before outsourcing
-----------------------------------------
- The specified 84 x 24 x 22 mm battery clearance envelope is tight in a
  90 mm outside-width body with 2.5 mm walls: only 85 mm internal width remains.
  The starter uses 96 mm outer width to allow more practical sliding clearance.
  If 90 mm width is mandatory, redesign the tray/wire exit and physically verify
  clearance before printing.
- A 20 cm^3 chamber with 21 mm depth requires about 952 mm^2 cross-sectional
  area. A 36 x 27 mm rectangle is about 972 mm^2 before corner rounding and
  speaker intrusion; verify actual net internal volume in CAD.
- The speaker lip/groove geometry is a visual starting point and must be
  reworked into a true 1.5 mm-deep gasket groove with the correct gasket squeeze.
- The head display tilt is represented by a cradle rotation only; its final
  orientation must be checked in the complete assembly.
- The 6 x 6 mm tactile switch does not define the external actuator/cap size.
  Measure the switch height, actuator height and PCB mounting arrangement.
- Measure the actual SS-12D00 switch body, lever travel, and mounting method.
  The rear cutout dimensions in this starter are placeholders.
- Confirm TP4056/USB-C combo board connector position and actual board dimensions.
- Add strain relief, insulation, polarity protection, and a child-resistant
  battery compartment. Never charge an unattended prototype. Verify battery
  protection and charging behavior with the exact cell and board.
- Confirm ESP32 antenna keep-out, USB connector access, standoff pattern, and
  board revision.
- Acoustic isolation needs physical tests: a 2 mm port and partition do not
  alone guarantee echo/feedback prevention.

Suggested FreeCAD workflow
--------------------------
1. Import/trace dimensions from the starter; build each part as a separate
   Part Design Body using fully constrained sketches.
2. Store dimensions in a Spreadsheet named Parameters.
3. Build an Assembly and insert simplified component envelopes.
4. Use interference checks and verify service access.
5. Use TechDraw for orthographic and exploded assembly drawings.
6. Export individual bodies to STEP/STL and provide a BOM and assembly guide.
7. Print a bezel test coupon and battery-tray fit coupon before full outsourcing.
