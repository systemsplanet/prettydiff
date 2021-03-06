/*global global, prettydiff*/
(function beautify_markup_init():void {
    "use strict";
    const markup = function beautify_markup(options:any):string {
        const data:parsedArray = options.parsed,
            lexer:string = "markup",
            c:number            = (options.end < 1 || options.end > data.token.length)
                ? data.token.length
                : options.end,
            lf:"\r\n"|"\n"      = (options.crlf === true)
                ? "\r\n"
                : "\n",
            levels:number[] = (function beautify_markup_levels():number[] {
                const level:number[]      = (options.start > 0)
                        ? Array(options.start).fill(0, 0, options.start)
                        : [],
                    nextIndex = function beautify_markup_levels_next():number {
                        let x:number = a + 1,
                            y:number = 0;
                        if (data.types[x] === "comment" || data.types[x] === "attribute" || data.types[x] === "template_attribute" || data.types[x] === "jsx_attribute_start") {
                            do {
                                if (data.types[x] === "jsx_attribute_start") {
                                    y = x;
                                    do {
                                        if (data.types[x] === "jsx_attribute_end" && data.begin[x] === y) {
                                            break;
                                        }
                                        x = x + 1;
                                    } while (x < c);
                                } else if (data.types[x] !== "comment" && data.types[x] !== "attribute" && data.types[x] !== "template_attribute") {
                                    return x;
                                }
                                x = x + 1;
                            } while (x < c);
                        }
                        return x;
                    },
                    comment = function beautify_markup_levels_comment():void {
                        let x:number = a,
                            test:boolean = false;
                        if (data.lines[a + 1] === 0) {
                            do {
                                if (data.lines[x] > 0) {
                                    test = true;
                                    break;
                                }
                                x = x - 1;
                            } while (x > comstart);
                            x = a;
                        } else {
                            test = true;
                        }

                        // the first condition applies indentation while the else block does not
                        if (test === true) {
                            let ind = (data.types[next] === "end" || data.types[next] === "template_end")
                                ? indent + 1
                                : indent;
                            do {
                                level.push(ind);
                                x = x - 1;
                            } while (x > comstart);

                            // correction so that a following end tag is not indented 1 too much
                            if (ind === indent + 1) {
                                level[a] = indent;
                            }

                            // indentation must be applied to the tag preceeding the comment
                            if (data.types[x] === "attribute" || data.types[x] === "template_attribute" || data.types[x] === "jsx_attribute_start") {
                                level[data.begin[x]] = ind;
                            } else {
                                level[x] = ind;
                            }
                        } else {
                            do {
                                level.push(-20);
                                x = x - 1;
                            } while (x > comstart);
                            level[x] = -20;
                        }
                        comstart = -1;
                    };
                let a:number     = options.start,
                    comstart:number = -1,
                    next:number = 0,
                    indent:number       = (isNaN(options.indent_level) === true)
                        ? 0
                        : Number(options.indent_level);
                // data.lines -> space before token
                // level -> space after token
                do {
                    if (data.lexer[a] === lexer) {
                        if (data.types[a] === "attribute" || data.types[a] === "template_attribute") {
                            level.push(-10);
                        } else if (data.types[a] === "jsx_attribute_start") {
                            if (data.lexer[a + 1] !== lexer && data.types[a - 1] !== "jsx_attribute_end") {
                                indent = indent + 1;
                            }
                            level.push(indent);
                        } else if (data.types[a] === "jsx_attribute_end") {
                            if (data.lexer[a - 1] === lexer && level[a - 1] > 0) {
                                level[a - 1] = level[a - 1] - 1;
                            }
                            level.push(-10);
                        } else if (data.types[a] === "comment") {
                            if (comstart < 0) {
                                comstart = a;
                            }
                            if (data.types[a + 1] !== "comment") {
                                comment();
                            }
                        } else if (data.types[a] !== "comment") {
                            next = nextIndex();
                            if (data.types[next] === "end" || data.types[next] === "template_end") {
                                indent = indent - 1;
                            }
                            if (options.force_indent === false && (data.types[a] === "content" || data.types[a] === "singleton" || data.types[a] === "template")) {
                                if (next < c && (data.types[next].indexOf("end") > -1 || data.types[next].indexOf("start") > -1) && data.lines[next] > 0) {
                                    level.push(indent);
                                } else if (data.lines[next] === 0) {
                                    level.push(-20);
                                } else if (data.lines[next] === 1) {
                                    level.push(-10);
                                } else {
                                    level.push(indent);
                                }
                            } else if (data.types[a] === "start" || data.types[a] === "template_start") {
                                indent = indent + 1;
                                if (options.force_indent === true) {
                                    level.push(indent);
                                } else if (data.types[a] === "start" && data.types[next] === "end") {
                                    level.push(-20);
                                } else if (data.types[a] === "template_start" && data.types[next] === "template_end") {
                                    level.push(-20);
                                } else if (data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                    level.push(-20);
                                } else {
                                    level.push(indent);
                                }
                            } else if (options.force_indent === false && data.lines[next] === 0 && (data.types[next] === "content" || data.types[next] === "singleton")) {
                                level.push(-20);
                            } else {
                                level.push(indent);
                            }
                        }
                    } else {
                        if (data.lexer[a + 1] === lexer && (data.begin[a + 1] === data.begin[a] || data.begin[a + 1] === undefined)) {
                            level.push(a);
                        } else {
                            if (data.lexer[a + 1] === lexer && (data.begin[a + 1] === data.begin[a] || data.begin[a + 1] === undefined)) {
                                level.push(a);
                            } else {
                                const skip:number = a;
                                do {
                                    if (data.lexer[a] === lexer && data.begin[a] < 0) {
                                        break;
                                    }
                                    level.push(0);
                                    a = a + 1;
                                } while (a < c && (data.lexer[a + 1] !== lexer || data.begin[a + 1] >= skip));
                                level.push(a);
                                level[skip] = a;
                            }
                        }
                        next = nextIndex();
                        if (data.lexer[next] === lexer && (data.types[next] === "end" || data.types[next] === "template_end")) {
                            indent = indent - 1;
                        }
                    }
                    a = a + 1;
                } while (a < c);
                return level;
            }());
        return (function beautify_markup_apply():string {
            const build:string[]        = [],
                ind          = (function beautify_markup_apply_tab():string {
                    const indy:string[] = [options.indent_char],
                        size:number = options.indent_size - 1;
                    let aa:number   = 0;
                    if (aa < size) {
                        do {
                            indy.push(options.indent_char);
                            aa = aa + 1;
                        } while (aa < size);
                    }
                    return indy.join("");
                }()),
                // a new line character plus the correct amount of identation for the given line
                // of code
                nl           = function beautify_markup_apply_nl(tabs:number):string {
                    const linesout:string[] = [],
                        pres:number = options.preserve + 1,
                        end:string = (options.crlf === true)
                            ? "\r\n"
                            : "\n",
                        total:number = Math.min((data.lines[a + 1] - 1), pres);
                    let index = 0;
                    if (tabs < 0) {
                        tabs = 0;
                    }
                    do {
                        linesout.push(end);
                        index = index + 1;
                    } while (index < total);
                    if (tabs > 0) {
                        index = 0;
                        do {
                            linesout.push(ind);
                            index = index + 1;
                        } while (index < tabs);
                    }
                    return linesout.join("");
                },
                attribute = function beautify_markup_apply_attribute():void {
                    const end:string[]|null = (/\/?>$/).exec(data.token[a]),
                        findEnd = function beautify_markup_apply_attribute_findEnd() {
                            const begin:number = y;
                            if (data.types[y] === "jsx_attribute_start") {
                                do {
                                    if (data.types[y] === "jsx_attribute_end" && data.begin[y] === begin) {
                                        break;
                                    }
                                    y = y + 1;
                                } while (y < c);
                            }
                            y = y + 1;
                            if (data.types[y] === "attribute" || data.types[y] === "template_attribute" || data.types[y] === "jsx_attribute_start") {
                                beautify_markup_apply_attribute_findEnd();
                            } else {
                                levels[y - 1] = lev;
                                data.token[y - 1] = data.token[y - 1] + ending;
                            }
                        };
                    if (end === null) {
                        return;
                    }
                    let y:number = a + 1,
                        lev:number = levels[a],
                        ending:string = end[0];
                    if (data.token[a].indexOf("</") === 0) {
                        return;
                    }
                    data.token[a] = data.token[a].slice(0, data.token[a].lastIndexOf(ending));
                    levels[a] = -10;
                    findEnd();
                };
            let a:number            = options.start,
                external:string = "",
                lastLevel:number = 0;
            do {
                if (data.lexer[a] === lexer || prettydiff.beautify[data.lexer[a]] === undefined) {
                    if (data.token[a] === "</prettydiffli>" && options.correct === true) {
                        data.token[a] = "</li>";
                    }
                    if (a < c - 1 && data.types[a + 1].indexOf("attribute") > -1 && data.types[a].indexOf("attribute") < 0) {
                        attribute();
                    }
                    if (data.token[a] !== "</prettydiffli>" && data.token[a].slice(0, 2) !== "//" && data.token[a].slice(0, 2) !== "/*") {
                        if (data.types[a] === "jsx_attribute_end" && levels[a] < 0) {
                            build.push(nl(lastLevel - 1));
                        }
                        build.push(data.token[a]);
                        if ((data.types[a] === "template" || data.types[a] === "template_start") && data.types[a - 1] === "content" && data.presv[a - 1] === true && options.mode === "beautify" && levels[a] === -20) {
                            build.push(" ");
                        }
                        if (levels[a] > -1 || (options.force_indent === true && a < c - 1 && data.types[a + 1].indexOf("attribute") < 0)) {
                            lastLevel = levels[a];
                            build.push(nl(levels[a]));
                        } else if (levels[a] === -10) {
                            build.push(" ");
                        }
                    }
                } else {
                    if (levels[a] - a < 1) {
                        build.push(data.token[a]);
                    } else {
                        options.end = levels[a] + 1;
                        options.indent_level = lastLevel;
                        options.start = a;
                        external = prettydiff.beautify[data.lexer[a]](options).replace(/\s+$/, "");
                        build.push(external);
                        if (data.types[a - 1] !== "jsx_attribute_start") {
                            build.push(nl(lastLevel - 1));
                        }
                        a = levels[a];
                    }
                }
                a = a + 1;
            } while (a < c);
            if (build[0] === lf || build[0] === " ") {
                build[0] = "";
            }
            if (options.new_line === true && options.end === data.token.length) {
                build.push(lf);
            }
            return build.join("");
        }());
    };
    global.prettydiff.beautify.markup = markup;
}());