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
    ${dataBlock}
    (func $d (result i32 i32 i32)
      (local $r i32)
      (local $g i32)
      (local $b i32)
      (local $a i32)
      (local $pixelsLength i32)
      (local $loop_counter i32) 
      (local $qoi_index i32)
      (local $index_offset i32)
      (local $run i32)
      (local $b1 i32)
      (local $vg i32)
      (local $newHash i32)
      (local $pixelIndex i32)
  
      i32.const ${decompSize}
      tee_local $pixelsLength
      set_local $qoi_index
      
      i32.const ${decompSize + qoiSize}
      set_local $index_offset
  
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
      local.get $qoi_index
      i32.load8_u
      local.tee $b1
      local.get $qoi_index
      i32.const 1
      i32.add
      local.set $qoi_index
      
      ;; RGB
      i32.const 254
      i32.ge_u
      if
          ;; r == data++
          local.get $qoi_index
          i32.load8_u
          local.set $r
          local.get $qoi_index
          i32.const 1
          i32.add
          local.tee $qoi_index
          ;; g == data++
          i32.load8_u
          local.set $g
          local.get $qoi_index
          i32.const 1
          i32.add
          local.tee $qoi_index
          ;; b == data++
          i32.load8_u
          local.set $b
          local.get $qoi_index
          i32.const 1
          i32.add
          local.set $qoi_index

          ;; alpha
          i32.const 255
          local.get $b1
          i32.eq
          if
            local.get $qoi_index
            i32.load8_u
            local.set $a
            local.get $qoi_index
            i32.const 1
            i32.add
            local.set $qoi_index
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
                      get_local $b1
                      i32.const 4
                      i32.mul
                      set_local $pixelIndex
                      
                      get_local $pixelIndex
                      get_local $index_offset
                      i32.add
                      i32.load8_u
                      set_local $r
  
                      get_local $pixelIndex
                      get_local $index_offset
                      i32.add
                      i32.const 1
                      i32.add
                      i32.load8_u
                      set_local $g
  
                      get_local $pixelIndex
                      get_local $index_offset
                      i32.add
                      i32.const 2
                      i32.add
                      i32.load8_u
                      set_local $b
  
                      get_local $pixelIndex
                      get_local $index_offset
                      i32.add
                      i32.const 3
                      i32.add
                      i32.load8_u
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
                          local.get $qoi_index
                          i32.load8_u
                          local.set $b1
                          local.get $qoi_index
                          i32.const 1
                          i32.add
                          local.set $qoi_index
  
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
      i32.const 64
      i32.rem_u
      i32.const 4
      i32.mul
      get_local $index_offset
      i32.add
      tee_local $newHash
      get_local $r
      i32.store8
      get_local $newHash
      i32.const 1
      i32.add
      get_local $g
      i32.store8
      get_local $newHash
      i32.const 2
      i32.add
      get_local $b
      i32.store8
      get_local $newHash
      i32.const 3
      i32.add
      get_local $a
      i32.store8
  
  
      ;; SET INDEX
      end
      ;; SET PIXELS
      
      ;; Address
      local.get $loop_counter
      ;; value
      local.get $r
      ;; store
      i32.store8
  
      local.get $loop_counter
      i32.const 1
      i32.add
      local.get $g
      i32.store8
  
      local.get $loop_counter
      i32.const 2
      i32.add
      local.get $b
      i32.store8
  
      ;; alpha
      local.get $loop_counter
      i32.const 3
      i32.add
      local.get $a
      i32.store8
  
      ;; loop until end of output pixels
      i32.const ${colorChannels}
      local.get $loop_counter
      i32.add
      local.tee $loop_counter
      local.get $pixelsLength
      i32.lt_s
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
