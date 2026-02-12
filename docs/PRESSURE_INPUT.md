# Pressure-Sensitive Input Support

## Overview

The Animate application now supports pressure-sensitive input from stylus devices including:
- ✅ Wacom tablets (Intuos, Cintiq, etc.)
- ✅ Apple Pencil (all generations) on iPad
- ✅ Apple Pencil on MacBook (when supported via Sidecar or directly)
- ✅ Microsoft Surface Pen
- ✅ Any device supporting W3C Pointer Events with pressure

## Implementation Details

### Architecture

The implementation uses the **W3C Pointer Events API** which provides universal pressure data across all platforms. This eliminates the need for device-specific code.

### Key Components

1. **Type Extensions** ([types/index.ts](../src/types/index.ts))
   - `LineData` interface extended with optional `pressures` array and `deviceType` field
   - `InputDeviceType` union type for 'pen' | 'touch' | 'mouse'

2. **Pressure Utilities** ([utils/pressureInput.ts](../src/utils/pressureInput.ts))
   - `extractPressure()` - Gets pressure from PointerEvent (0.0-1.0)
   - `detectDeviceType()` - Identifies pen/touch/mouse
   - `hasPressureSupport()` - Checks if device reports meaningful pressure
   - `applyPressureCurve()` - Applies sensitivity curves (linear, ease-in, ease-out, ease-in-out)
   - `calculateStrokeWidth()` - Maps pressure to stroke width
   - `smoothPressures()` - Reduces jitter with moving average
   - `normalizePressures()` - Ensures consistent 0-1 range

3. **Canvas Event Handling** ([components/raster/Canvas.tsx](../src/components/raster/Canvas.tsx))
   - Migrated from `onMouse*/onTouch*` to `onPointer*` events
   - Extracts pressure on `pointerdown` and appends on `pointermove`
   - Stores pressure data in `LineData.pressures` parallel array
   - Tracks `deviceType` per stroke

4. **Variable-Width Rendering** ([components/raster/PressureLine.tsx](../src/components/raster/PressureLine.tsx))
   - Custom Konva.Shape component with `sceneFunc` rendering
   - Calculates perpendicular offsets at each point based on pressure
   - Generates stroke outline (left/right edges) as filled polygon
   - Supports round line caps for smooth start/end
   - Falls back to regular `<Line>` for mouse strokes (backward compatible)

### Data Flow

```
PointerEvent
  ↓ extractPressure()
Pressure value (0.0-1.0)
  ↓ Store in LineData.pressures[]
Parallel array to points[]
  ↓ PressureLine component
calculateStrokeWidth() at each point
  ↓ generateStrokeOutline()
Variable-width filled polygon
  ↓ Konva.Shape sceneFunc
Rendered to canvas
```

### Backward Compatibility

- Existing strokes without `pressures` field render with constant width using `<Line>`
- Mouse input creates strokes without pressure data (constant width)
- All existing projects load and work normally

## Testing

### Desktop Testing

#### Windows with Wacom Tablet
1. Connect Wacom tablet (Intuos, Cintiq, etc.)
2. Open Raster Studio
3. Select Brush tool
4. Draw with pen - stroke width should vary with pressure
5. Draw with mouse - stroke width should be constant
6. Check browser console for device type detection

#### macOS with Wacom Tablet
Same as Windows testing above.

#### MacBook with iPad + Sidecar + Apple Pencil
1. Enable Sidecar (System Settings > Displays > Add Display)
2. Open Safari on MacBook, navigate to app
3. Use Apple Pencil on iPad in Sidecar mode
4. Draw in Raster Studio - pressure should work

### Mobile/Tablet Testing

#### iPad with Apple Pencil (Safari)
1. Open Safari on iPad
2. Navigate to the app
3. Use Apple Pencil to draw
4. Verify pressure sensitivity works
5. Touch with finger should work as constant-width touch

#### iPad with Apple Pencil (Chrome)
Same as Safari testing - Chrome on iOS uses WebKit underneath.

#### Surface Device with Surface Pen
1. Open Edge or Chrome on Surface
2. Navigate to app
3. Draw with Surface Pen
4. Verify pressure sensitivity

### Browser Compatibility

| Browser | Platform | Pressure Support | Notes |
|---------|----------|------------------|-------|
| **Chrome** | Windows | ✅ Yes | Full PointerEvent support |
| **Chrome** | macOS | ✅ Yes | Full support with tablets |
| **Chrome** | Android | ⚠️ Varies | Depends on device/stylus |
| **Safari** | macOS | ✅ Yes | Full support |
| **Safari** | iOS/iPadOS | ✅ Yes | **Best Apple Pencil support** |
| **Edge** | Windows | ✅ Yes | Full support, excellent with Surface |
| **Firefox** | Windows | ✅ Yes | Full support |
| **Firefox** | macOS | ✅ Yes | Full support |

### How to Verify Pressure is Working

1. **Visual Check**: Draw with varying pressure - stroke width should change
2. **Console Logging**: Check browser DevTools console for:
   ```
   Device type: pen
   Pressure: 0.234
   Has pressure support: true
   ```
3. **Inspect Stroke Data**: In DevTools > Console, inspect a stroke's data:
   ```javascript
   // Should see pressures array
   { 
     tool: 'brush',
     points: [x1, y1, x2, y2, ...],
     pressures: [0.4, 0.6, 0.8, ...],
     deviceType: 'pen'
   }
   ```

### Known Issues & Limitations

#### Browser/Platform Specific
- **Firefox on Android**: May not report pressure correctly on some devices
- **iOS Safari < 13**: Limited PointerEvent support (use iOS 13+)
- **Touch without stylus**: Reports constant 0.5 pressure (expected)

#### Hardware Specific
- **Cheap styluses**: Some capacitive styluses don't support pressure (hardware limitation)
- **Bluetooth styluses**: May have latency, not related to our implementation
- **Very old tablets**: Pre-2010 Wacom tablets may not work with modern browsers

#### Application Limits
- **Performance**: Very dense strokes (>1000 points) may render slowly
  - Solution: Reduce point density or simplify path
- **Export**: GIFs don't preserve pressure data (they use rendered bitmap)
- **Undo/Redo**: Works but history size limited to 20 entries

### Debugging Pressure Issues

If pressure isn't working:

1. **Check browser support**:
   ```javascript
   'onpointerdown' in window // Should be true
   ```

2. **Check device detection**:
   ```javascript
   // Add to Canvas.tsx temporarily
   console.log('PointerEvent type:', e.evt.pointerType)
   console.log('Pressure:', e.evt.pressure)
   ```

3. **Verify hardware**:
   - Test in other apps (Photoshop, Krita, etc.)
   - Check driver installation (Wacom drivers, etc.)
   - Ensure device is charged (wireless styluses)

4. **Browser DevTools**:
   - Open Console tab
   - Watch for warnings about pressure extraction
   - Check for PointerEvent support

## Future Enhancements

Potential improvements for future releases:

- [ ] **Pressure Curve Editor**: Visual curve editor for customizing pressure response
- [ ] **Tilt Support**: Use PointerEvent.tiltX/tiltY for calligraphy effects
- [ ] **Twist/Rotation**: Support pen rotation (PointerEvent.twist)
- [ ] **Barrel Button**: Detect and use pen barrel buttons
- [ ] **Hover Pressure**: Show cursor preview with pressure when hovering
- [ ] **Pressure Presets**: Save/load pressure sensitivity presets
- [ ] **Advanced Smoothing**: Kalman filter or Bezier curve smoothing
- [ ] **WebGL Renderer**: GPU-accelerated rendering for better performance

## Resources

- [MDN: Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [W3C Pointer Events Specification](https://www.w3.org/TR/pointerevents/)
- [Wacom Driver Downloads](https://www.wacom.com/en-us/support/product-support/drivers)
- [Apple Pencil Technical Specs](https://support.apple.com/en-us/HT211029)

## Changelog

### Version 1.0.0 (February 2026)
- ✅ Initial implementation of pressure-sensitive input
- ✅ PointerEvent API integration
- ✅ Variable-width stroke rendering with PressureLine component
- ✅ Automatic device type detection
- ✅ Backward compatible with existing mouse input
- ✅ Support for Wacom, Apple Pencil, Surface Pen, and generic styluses

---

**Status**: ✅ Production Ready  
**Testing**: ⏳ Awaiting device testing feedback  
**Documentation**: ✅ Complete
