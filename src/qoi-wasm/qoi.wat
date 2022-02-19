(module
  (import "m" "m" (memory 1))
  (global $qi (mut i32) (i32.const 14))
  (func $getAndInc (result i32)
    get_global $qi
    i32.load8_u
    get_global $qi
    i32.const 1
    i32.add
    set_global $qi
  )
  (func $bigEndianParse (param i32) (result i32)
    get_local 0
    i32.load8_u
    i32.const 24
    i32.shl
    get_local 0
    i32.const 1
    i32.add
    i32.load8_u
    i32.const 16
    i32.shl
    get_local 0
    i32.const 2
    i32.add
    i32.load8_u
    i32.const 8
    i32.shl
    get_local 0
    i32.const 3
    i32.add
    i32.load8_u
    i32.or
    i32.or
    i32.or
  )
  (func $decode (result i32 i32 i32 i32 i32)
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
    (local $run i32)
    (local $current i32)
    (local $luma i32)
    (local $newHash i32)
    (local $pixelIndex i32)

    ;; verify magic number
    i32.const 0
    i32.load
    i32.const 1718185841
    i32.eq
    if
    
    ;; parse width
    i32.const 4
    call $bigEndianParse
    tee_local $width

    ;; parse height
    i32.const 8
    call $bigEndianParse
    tee_local $height

    ;; parse channels
    i32.const 12
    i32.load8_u
    tee_local $channels

    ;; calculate size
    i32.mul
    i32.mul
    tee_local $pixelsLength
    i32.const 256
    i32.add

    ;; allocate data
    i32.const 65536
    i32.div_u
    i32.const 1
    i32.add
    memory.grow
    i32.const 65536
    i32.mul
    tee_local $index_offset
    i32.const 256
    i32.add
    set_local $pagesOffset

    ;; init locals
    i32.const 255
    set_local $a

    ;; decoder loop
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

    call $getAndInc
    tee_local $current
    
    ;; RGB,A
    i32.const 254
    i32.ge_u
    if
        ;; r == data++
        call $getAndInc
        set_local $r
        ;; g == data++
        call $getAndInc
        set_local $g
        ;; b == data++
        call $getAndInc
        set_local $b

        ;; alpha
        i32.const 255
        get_local $current
        i32.eq
        if
            call $getAndInc
            set_local $a
        end
    else
        ;; RUN
        i32.const 192
        get_local $current
        i32.and
        i32.const 192
        i32.eq
        if
            i32.const 63
            get_local $current
            i32.and
            set_local $run
        else
            ;; INDEX
            i32.const 192
            get_local $current
            i32.and
            i32.const 0
            i32.eq
            if
                get_local $current
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
                get_local $current
                i32.and
                i32.const 64
                i32.eq
                if
                    get_local $current
                    i32.const 4
                    i32.shr_u
                    i32.const 3
                    i32.and
                    i32.const 2
                    i32.sub
                    get_local $r
                    i32.add
                    set_local $r

                    get_local $current
                    i32.const 2
                    i32.shr_u
                    i32.const 3
                    i32.and
                    i32.const 2
                    i32.sub
                    get_local $g
                    i32.add
                    set_local $g

                    get_local $current
                    i32.const 3
                    i32.and
                    i32.const 2
                    i32.sub
                    get_local $b
                    i32.add
                    set_local $b
                else
                    ;; LUMA
                    get_local $current
                    call $getAndInc
                    set_local $current

                    i32.const 63
                    i32.and
                    i32.const 32
                    i32.sub
                    tee_local $luma

                    get_local $g
                    i32.add
                    set_local $g

                    get_local $current
                    i32.const 4
                    i32.shr_u
                    i32.const 15
                    i32.and
                    get_local $luma
                    i32.const 8
                    i32.sub
                    i32.add
                    get_local $r
                    i32.add
                    set_local $r

                    get_local $current
                    i32.const 15
                    i32.and
                    get_local $luma
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
    end
    ;; Address
    get_local $pagesOffset
    get_local $loop_counter
    i32.add
    tee_local $current
    ;; value
    get_local $r
    ;; store
    i32.store8

    get_local $current
    i32.const 1
    i32.add
    get_local $g
    i32.store8

    get_local $current
    i32.const 2
    i32.add
    get_local $b
    i32.store8

    i32.const 4
    get_local $channels
    i32.eq
    if
    ;; alpha
    get_local $current
    i32.const 3
    i32.add
    get_local $a
    i32.store8
    end

    ;; loop until end of output pixels
    get_local $channels
    get_local $loop_counter
    i32.add
    tee_local $loop_counter
    get_local $pixelsLength
    i32.lt_s
    br_if $loop
    end

    end
    get_local $width
    get_local $height
    get_local $channels
    ;; parse colorspace
    i32.const 13
    i32.load8_u
    get_local $pagesOffset
  )
  (export "decode" (func $decode))
)