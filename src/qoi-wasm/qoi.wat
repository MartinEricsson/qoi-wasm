(module
  (import "m" "m" (memory 1))
  (global $qi (mut i32) (i32.const 14))
  (func $getAndInc (result i32)
    global.get $qi
    i32.load8_u
    global.get $qi
    i32.const 1
    i32.add
    global.set $qi
  )
  (func $bigEndianParse (param i32) (result i32)
    local.get 0
    i32.load8_u
    i32.const 24
    i32.shl
    local.get 0
    i32.load8_u offset=1
    i32.const 16
    i32.shl
    local.get 0
    i32.load8_u offset=2
    i32.const 8
    i32.shl
    local.get 0
    i32.load8_u offset=3
    i32.or
    i32.or
    i32.or
  )
  (func $d (result i32 i32 i32 i32 i32)
    (local $r i32)
    (local $g i32)
    (local $b i32)
    (local $a i32)
    (local $pagesOffset i32)
    (local $pixelsLength i32)
    (local $loop_counter i32)
    (local $index_offset i32)
    (local $width i32)
    (local $height i32)
    (local $channels i32)
    (local $hasAlpha i32)
    (local $run i32)
    (local $current i32)
    (local $luma i32)

    ;; verify magic number
    i32.const 0
    i32.load
    i32.const 1718185841
    i32.eq
    if

    ;; parse width
    i32.const 4
    call $bigEndianParse
    local.tee $width

    ;; parse height
    i32.const 8
    call $bigEndianParse
    local.tee $height

    ;; parse channels
    i32.const 12
    i32.load8_u
    local.tee $channels

    ;; cache channels==4
    local.get $channels
    i32.const 4
    i32.eq
    local.set $hasAlpha

    ;; calculate size
    i32.mul
    i32.mul
    local.tee $pixelsLength
    i32.const 256
    i32.add

    ;; allocate data
    i32.const 16
    i32.shr_u
    i32.const 1
    i32.add
    memory.grow
    i32.const 16
    i32.shl
    local.tee $index_offset
    i32.const 256
    i32.add
    local.set $pagesOffset

    ;; init locals
    i32.const 255
    local.set $a

    ;; decoder loop
    loop $loop

      ;; run > 0
      local.get $run
      if
        local.get $run
        i32.const 1
        i32.sub
        local.set $run
      else

        call $getAndInc
        local.tee $current

        ;; RGB,A
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
          local.get $current
          i32.eq
          if
            call $getAndInc
            local.set $a
          end
        else
          ;; RUN (top two bits == 11)
          local.get $current
          i32.const 192
          i32.and
          i32.const 192
          i32.eq
          if
            i32.const 63
            local.get $current
            i32.and
            local.set $run
          else
            ;; INDEX
            local.get $current
            i32.const 192
            i32.and
            i32.eqz
            if
              local.get $index_offset
              local.get $current
              i32.const 2
              i32.shl
              i32.add
              local.tee $current
              i32.load8_u
              local.set $r

              local.get $current
              i32.load8_u offset=1
              local.set $g

              local.get $current
              i32.load8_u offset=2
              local.set $b

              local.get $current
              i32.load8_u offset=3
              local.set $a
            else
              ;; DIFF
              i32.const 192
              local.get $current
              i32.and
              i32.const 64
              i32.eq
              if
                local.get $current
                i32.const 4
                i32.shr_u
                i32.const 3
                i32.and
                i32.const 2
                i32.sub
                local.get $r
                i32.add
                local.set $r

                local.get $current
                i32.const 2
                i32.shr_u
                i32.const 3
                i32.and
                i32.const 2
                i32.sub
                local.get $g
                i32.add
                local.set $g

                local.get $current
                i32.const 3
                i32.and
                i32.const 2
                i32.sub
                local.get $b
                i32.add
                local.set $b
              else
                ;; LUMA
                local.get $current
                call $getAndInc
                local.set $current

                i32.const 63
                i32.and
                i32.const 32
                i32.sub
                local.tee $luma

                local.get $g
                i32.add
                local.set $g

                local.get $current
                i32.const 4
                i32.shr_u
                i32.const 15
                i32.and
                local.get $luma
                i32.const 8
                i32.sub
                i32.add
                local.get $r
                i32.add
                local.set $r

                local.get $current
                i32.const 15
                i32.and
                local.get $luma
                i32.const 8
                i32.sub
                i32.add
                local.get $b
                i32.add
                local.set $b
              end
            end
          end
        end
      end

      ;; HASH
      local.get $r
      i32.const 3
      i32.mul
      local.get $g
      i32.const 5
      i32.mul
      local.get $b
      i32.const 7
      i32.mul
      local.get $a
      i32.const 11
      i32.mul
      i32.add
      i32.add
      i32.add
      i32.const 63
      i32.and
      i32.const 2
      i32.shl
      local.get $index_offset
      i32.add
      local.tee $current
      local.get $r
      i32.store8
      local.get $current
      local.get $g
      i32.store8 offset=1
      local.get $current
      local.get $b
      i32.store8 offset=2
      local.get $current
      local.get $a
      i32.store8 offset=3

      ;; Address
      local.get $pagesOffset
      local.get $loop_counter
      i32.add
      local.tee $current
      ;; value
      local.get $r
      ;; store
      i32.store8

      local.get $current
      local.get $g
      i32.store8 offset=1

      local.get $current
      local.get $b
      i32.store8 offset=2

      local.get $hasAlpha
      if
        ;; alpha
        local.get $current
        local.get $a
        i32.store8 offset=3
      end

      ;; loop until end of output pixels
      local.get $channels
      local.get $loop_counter
      i32.add
      local.tee $loop_counter
      local.get $pixelsLength
      i32.lt_u
      br_if $loop
    end

    end
    local.get $width
    local.get $height
    local.get $channels
    ;; parse colorspace
    i32.const 13
    i32.load8_u
    local.get $pagesOffset
  )
  (export "d" (func $d))
)