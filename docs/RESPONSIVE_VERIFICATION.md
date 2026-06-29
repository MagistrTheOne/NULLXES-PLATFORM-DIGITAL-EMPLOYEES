# Responsive Platform Verification

Manual viewport checklist after layout changes. Test in Chrome DevTools device mode and on at least one real phone/tablet if available.

## Target widths

| Label | Width | Device class |
|---|---|---|
| Mobile | 390px | Phone |
| Large phone | 430px | Phone |
| Tablet portrait | 768px | Tablet |
| Tablet landscape | 1024px | Tablet / small laptop |
| Laptop | 1440px | Desktop |
| 27-inch | 2560px | Wide desktop |

## Routes

- `/dashboard/employees`
- `/dashboard/employees/[id]`
- `/dashboard/employees/[id]/talk`
- `/dashboard/admin/anam` (platform admin only)
- `/settings`
- `/dashboard/hq`

## Global shell

- [ ] Sidebar collapses to sheet on mobile (`<768px`)
- [ ] Sidebar trigger visible in topbar on all sizes
- [ ] No horizontal page scroll at any target width
- [ ] Content respects max width on laptop; uses extra columns on 2560px
- [ ] Safe-area padding respected on notched phones (topbar, talk controls)

## Digital Employees

- [ ] Grid: 1 col mobile, 2 tablet, 3 laptop, 4 desktop, 5 at 1800px+
- [ ] Pagination remains usable on mobile
- [ ] Failed provisioning text line-clamps on cards (no row blowout)
- [ ] Metrics strip stays 2x2 on mobile, 4 columns on large screens

## Employee detail

- [ ] Avatar card stacks above tabs on mobile/tablet
- [ ] Avatar card sticky only on `xl+`
- [ ] Header actions do not overflow on narrow screens

## Talk session

- [ ] Stage is primary on mobile/tablet (no permanent right rail below `lg`)
- [ ] Details opens in sheet below `lg` via header button
- [ ] Right inspector rail visible at `lg+` (1024px+)
- [ ] Floating controls sit above safe-area inset on mobile
- [ ] Workforce strip hidden on mobile, visible from `md+`
- [ ] Chat sheet still opens from stage controls
- [ ] Focus mode hides side panel and shows exit control

## Settings / Admin

- [ ] Settings tabs scroll horizontally on mobile without wrapping awkwardly
- [ ] Context panel stacks below main content below `xl`
- [ ] Anam admin metrics use shared 2x2 / 4-col grid
- [ ] Anam slot employee lists scroll on mobile when long

## Pass criteria

All checked items pass with no clipped controls, no horizontal overflow, and primary tasks completable on each viewport class.
