---
trigger: manual
---
Design Principles to Follow:

Aesthetic Usability: Use spacing/typography to make forms feel easier
Hick’s Law: Avoid clutter; collapse complex settings
Jakob’s Law: Stick to familiar WP Admin patterns (cards, sidebars, modals)
Fitts’s Law:	Place important buttons close, large, clear
Law of Proximity: 	Group logic and inputs with spacing + PanelBody + layout components
Zeigarnik Effect:	Use progress indicators, save states
Goal-Gradient:	Emphasize progress in wizards (e.g. New Rule flow)
Law of Similarity:	Ensure toggles, selectors, filters share styling and layout conventions.


Aesthetic-Usability Effect:

1.Clean, consistent spacing (e.g. gap-2, px-4)
2.Typography hierarchy (e.g. headings text-lg font-semibold)
3.Visual cues like subtle shadows or border separators improve perceived usability

Hick's Law:

1. Reduce visible options per screen
2.Collapse complex filters/conditions into toggles or expandable sections

Jakob’s Law:

1. Match WordPress admin conventions (e.g. table lists, modals, top bar)
2. Stick to familiar placement of "Add New", status toggles, and trash icons

Fitts’s Law:

1.Important actions (edit, delete) should be large, clickable buttons
2.Avoid tiny icon-only targets unless they are grouped and spaced (space-x-2)

Law of Proximity:

1.Group related controls using spacing + containers (e.g. PanelBody, Card)
2.Inputs related to conditions or filters should be visually bundled

Zeigarnik Effect:

1.Show progress in multi-step rule creation (stepper, breadcrumb, or "Step X of Y")
2.Save state feedback (e.g. "Saving..." or "Unsaved changes" banners)

Goal-Gradient Effect:

1. Emphasize next step in workflows (highlight active step, primary button styling)
2. Use progress bars or steppers to encourage completion

Law of Similarity:

1.Use consistent styles for toggle switches, buttons, badges, filters
2.Align icon sizing and spacing across all rows for visual rhythm

Miller's Law:

1.Don’t overload the user with options; chunk rule configuration into steps/panels
2.Default to collapsed sections (e.g. advanced options)

Doherty Threshold:

1. Aim for sub-400ms interactions (e.g. loading skeletons, optimistic UI)
2. Use loading states with spinners or shimmer placeholders