const compile = ({
    blocks,
    dataBlock,
    decompSize,
    qoiSize,
    width,
    height,
    colorChannels,
}) => `(module
    (memory (export "m") ${blocks})
    (global $qi (mut i32) (i32.const ${decompSize}))
    (func $getAndInc (result i32)
        get_global $qi
        i32.load8_u
        get_global $qi
        i32.const 1
        i32.add
        set_global $qi
    )
    ${dataBlock}
    (func $d (result i32 i32 i32)
      (local $r i32)
      (local $g i32)
      (local $b i32)
      (local $a i32)
      (local $pixelsLength i32)
      (local $loop_counter i32) 
      (local $index_offset i32)
      (local $run i32)
      (local $b1 i32)
      (local $vg i32)
      (local $newHash i32)
      (local $pixelIndex i32)
        (local $hasAlpha i32)
        (local $p i32)
  
      i32.const ${decompSize}
      set_local $pixelsLength
      
      i32.const ${decompSize + qoiSize}
      set_local $index_offset
  
    ;; cache channels==4 (has alpha)
    i32.const ${colorChannels}
    i32.const 4
    i32.eq
    set_local $hasAlpha

      i32.const 255
      set_local $a
  
      loop $loop
  
      ;; run > 0
      get_local $run
      i32.const 0
      i32.gt_s
      if
      get_local $run
      i32.const 1
      i32.sub
      set_local $run
      else
  
      ;; b1 = p[i++]
      call $getAndInc
      local.tee $b1
      
      ;; RGB
      i32.const 254
      i32.ge_u
      if
          ;; r == data++
          call $getAndInc
          local.set $r
          ;; g == data++
          call $getAndInc
          local.set $g
          ;; b == data++
          call $getAndInc
          local.set $b

          ;; alpha
          i32.const 255
          local.get $b1
          i32.eq
          if
            call $getAndInc
            local.set $a
          end
      else
              ;; RUN
              i32.const 192
              local.get $b1
              i32.and
              i32.const 192
              i32.eq
              if
                  i32.const 63
                  local.get $b1
                  i32.and
                  local.set $run
              else
                  ;; INDEX
                  i32.const 192
                  local.get $b1
                  i32.and
                  i32.const 0
                  i32.eq
                  if
                      ;; pixelIndex = b1 << 2
                      get_local $b1
                      i32.const 2
                      i32.shl
                      set_local $pixelIndex

                      ;; base = index_offset + pixelIndex
                      get_local $index_offset
                      get_local $pixelIndex
                      i32.add
                      i32.load8_u
                      set_local $r

                      get_local $index_offset
                      get_local $pixelIndex
                      i32.add
                      i32.load8_u offset=1
                      set_local $g

                      get_local $index_offset
                      get_local $pixelIndex
                      i32.add
                      i32.load8_u offset=2
                      set_local $b

                      get_local $index_offset
                      get_local $pixelIndex
                      i32.add
                      i32.load8_u offset=3
                      set_local $a

                  else
                      ;; DIFF
                      i32.const 192
                      local.get $b1
                      i32.and
                      i32.const 64
                      i32.eq
                      if
                          get_local $b1
                          i32.const 4
                          i32.shr_u
                          i32.const 3
                          i32.and
                          i32.const 2
                          i32.sub
                          get_local $r
                          i32.add
                          set_local $r
  
                          get_local $b1
                          i32.const 2
                          i32.shr_u
                          i32.const 3
                          i32.and
                          i32.const 2
                          i32.sub
                          get_local $g
                          i32.add
                          set_local $g
  
                          get_local $b1
                          i32.const 3
                          i32.and
                          i32.const 2
                          i32.sub
                          get_local $b
                          i32.add
                          set_local $b
                      else
                          ;; LUMA
                          get_local $b1
                          call $getAndInc
                          local.set $b1
  
                          i32.const 63
                          i32.and
                          i32.const 32
                          i32.sub
                          tee_local $vg
  
                          get_local $g
                          i32.add
                          set_local $g
  
                          get_local $b1
                          i32.const 4
                          i32.shr_u
                          i32.const 15
                          i32.and
                          get_local $vg
                          i32.const 8
                          i32.sub
                          i32.add
                          get_local $r
                          i32.add
                          set_local $r
  
                          get_local $b1
                          i32.const 15
                          i32.and
                          get_local $vg
                          i32.const 8
                          i32.sub
                          i32.add
                          get_local $b
                          i32.add
                          set_local $b
                      end
                  end
              end
          end
      
      
      ;; HASH
      get_local $r
      i32.const 3
      i32.mul
      get_local $g
      i32.const 5
      i32.mul
      get_local $b
      i32.const 7
      i32.mul
      get_local $a
      i32.const 11
      i32.mul
      i32.add
      i32.add
      i32.add
    i32.const 63
    i32.and
    i32.const 2
    i32.shl
      get_local $index_offset
      i32.add
      tee_local $newHash
    get_local $r
    i32.store8
    get_local $newHash
    get_local $g
    i32.store8 offset=1
    get_local $newHash
    get_local $b
    i32.store8 offset=2
    get_local $newHash
    get_local $a
    i32.store8 offset=3
  
  
      ;; SET INDEX
      end
      ;; SET PIXELS
      
            ;; Address base for this pixel
            local.get $loop_counter
            local.tee $p
            ;; R
            local.get $r
            i32.store8

            ;; G
            local.get $p
            local.get $g
            i32.store8 offset=1

            ;; B
            local.get $p
            local.get $b
            i32.store8 offset=2

            ;; A (only if has alpha)
            get_local $hasAlpha
            if
                local.get $p
                local.get $a
                i32.store8 offset=3
            end
  
      ;; loop until end of output pixels
      i32.const ${colorChannels}
      local.get $loop_counter
      i32.add
      local.tee $loop_counter
      local.get $pixelsLength
  i32.lt_u
      br_if $loop
      end
  
      ;; return header data
      i32.const ${width}
      i32.const ${height}
      i32.const ${colorChannels}
    )
    (export "d" (func $d))
  )`;

module.exports = compile;
