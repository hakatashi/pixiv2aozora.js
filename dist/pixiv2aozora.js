/*!
 * pixiv2aozora - v0.5.0 - 2015-09-01
 * https://github.com/hakatashi/pixiv2aozora.js#readme
 * Copyright (c) 2015 Koki Takahashi
 * Licensed under MIT License
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var global;

  if (!typeof module !== 'undefined') {
    global = window;
  }

  global.pixiv2aozora = require('./');

}).call(this);

},{"./":2}],2:[function(require,module,exports){
(function() {
  var META, Parser, entities, entityPresets, escapeAST, escapeText, pixiv2aozora, serialize, specialChars, specialCharsRegEx, tags, toAozora,
    slice = [].slice,
    hasProp = {}.hasOwnProperty;

  Parser = require('pixiv-novel-parser').Parser;

  META = {
    SOFTBREAK: 10001
  };

  entityPresets = {
    aozora: {
      '《': '※［＃始め二重山括弧、1-1-52］',
      '》': '※［＃終わり二重山括弧、1-1-53］',
      '［': '※［＃始め角括弧、1-1-46］',
      '］': '※［＃終わり角括弧、1-1-47］',
      '〔': '※［＃始めきっこう（亀甲）括弧、1-1-44］',
      '〕': '※［＃終わりきっこう（亀甲）括弧、1-1-45］',
      '｜': '※［＃縦線、1-1-35］',
      '＃': '※［＃井げた、1-1-84］',
      '※': '※［＃米印、1-2-8］'
    },
    publishing: {
      '《': '｜《',
      '》': '｜》',
      '［': '｜［',
      '］': '｜］',
      '〔': '〔',
      '〕': '〕',
      '｜': '｜｜',
      '＃': '＃',
      '※': '※'
    }
  };

  entities = null;

  specialChars = null;

  specialCharsRegEx = null;

  serialize = function(AST) {
    var aozora, j, len, token;
    switch (AST.type) {
      case void 0:
        aozora = [];
        for (j = 0, len = AST.length; j < len; j++) {
          token = AST[j];
          aozora.push.apply(aozora, serialize(token));
        }
        break;
      case 'tag':
        aozora = tags[AST.name](AST);
        break;
      case 'text':
        aozora = [AST.val];
    }
    return aozora;
  };

  escapeText = function(text) {
    return text.replace(specialCharsRegEx, function(char) {
      return entities[char];
    });
  };

  escapeAST = function(AST) {
    var index, j, len, token;
    switch (AST.type) {
      case void 0:
        for (index = j = 0, len = AST.length; j < len; index = ++j) {
          token = AST[index];
          AST[index] = escapeAST(token);
        }
        break;
      case 'tag':
        switch (AST.name) {
          case 'chapter':
            AST.title = escapeAST(AST.title);
            break;
          case 'rb':
            AST.rubyBase = escapeText(AST.rubyBase);
            AST.rubyText = escapeText(AST.rubyText);
            break;
          case 'jumpuri':
            AST.title = escapeAST(AST.title);
        }
        break;
      case 'text':
        AST.val = escapeText(AST.val);
    }
    return AST;
  };

  tags = {
    newpage: function() {
      return [META.SOFTBREAK, '［＃改ページ］', META.SOFTBREAK];
    },
    chapter: function(AST) {
      return [META.SOFTBREAK, '［＃大見出し］'].concat(slice.call(serialize(AST.title)), ['［＃大見出し終わり］'], [META.SOFTBREAK]);
    },
    rb: function(AST) {
      return ['｜', AST.rubyBase, '《', AST.rubyText, '》'];
    },
    pixivimage: function() {
      return [];
    },
    jumpuri: function(AST) {
      return serialize(AST.title);
    },
    jump: function(AST) {
      return [AST.pageNumber + "ページヘ"];
    }
  };

  toAozora = function(AST) {
    var i, j, len, token, tokens;
    tokens = serialize(AST);
    if (tokens[0] === META.SOFTBREAK) {
      tokens.shift();
    }
    if (tokens[tokens.length - 1] === META.SOFTBREAK) {
      tokens.pop();
    }
    for (i = j = 0, len = tokens.length; j < len; i = ++j) {
      token = tokens[i];
      if (token === META.SOFTBREAK) {
        tokens[i] = '\n';
      }
    }
    return tokens.join('');
  };

  pixiv2aozora = function(text, options) {
    var AST, char, entity, parser;
    if (options == null) {
      options = {};
    }
    if (typeof options !== 'object') {
      throw new Error('Invalid options');
    }
    if (options.entities == null) {
      options.entities = 'aozora';
    }
    if (typeof options.entities === 'string') {
      if (entityPresets[options.entities] == null) {
        throw new Error("Unknown entity presets " + options.entities);
      } else {
        entities = entityPresets[options.entities];
      }
    } else if (typeof options.entities === 'object') {
      entities = options.entities;
    } else {
      throw new Error('Invalid option for entity presets');
    }
    specialChars = ((function() {
      var results;
      results = [];
      for (char in entities) {
        if (!hasProp.call(entities, char)) continue;
        entity = entities[char];
        results.push(char);
      }
      return results;
    })()).join('');
    specialCharsRegEx = new RegExp("[" + (specialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')) + "]", 'g');
    parser = new Parser();
    parser.parse(text);
    AST = parser.tree;
    switch (typeof options.transform) {
      case 'undefined':
        AST = escapeAST(AST);
        break;
      case 'function':
        AST = options.transform.call(this, AST, escapeAST);
        break;
      default:
        throw new Error('Invalid options.transform');
    }
    return toAozora(AST);
  };

  module.exports = pixiv2aozora;

}).call(this);

},{"pixiv-novel-parser":3}],3:[function(require,module,exports){
(function () {
 /* jshint maxstatements: 1000 */
'use strict';
var basicParser, extendedParser;
basicParser = require('./parser.peg.js');
extendedParser = require('./parser-extended.peg.js');

/**
 * [newpage]
 * [chapter:.*]
 * [pixivimage:\d*(-\d*)?]
 * [jump:\d*]
 * [[jumpuri:.* > URL]]
 *
 * [ruby: rb > rt]
 * [emoji:.*]
 * [strong:.*]
 */
function Parser(options) {
  options = options || {};
  this.syntax = options.syntax || 'basic';
  this.tree = [];
}

/**
 * @param {string} novel
 * @param {Object,<string,Object>} options
 *   { syntax: 'basic' | 'extended' }
 * @return {Object.<string,Object>[]}
 */
Parser.parse = function (novel, options) {
  options = options || {};
  options.syntax = options.syntax || 'basic';
  try {
    novel = novel.replace(/\r?\n/g, '\n').
      replace(/[\s\u200c]/g, function (c) {
        if (c === '\n' || c === '\u3000') { return c; }
        return ' ';
      });
    switch (options.syntax) {
      case 'extended':
        return extendedParser.parse(novel);
      case 'basic':
        /* falls through */
      default:
        return basicParser.parse(novel);
    }
  } catch (err) {
    console.error(err);
    return [{ type: 'text', val: novel }];
  }
};

/**
 * @param {string} novel
 * @return {Parser}
 */
Parser.prototype.parse = function (novel) {
  this.tree = Parser.parse(novel, { syntax: this.syntax });
  return this;
};

/**
 * @return {string}
 */
Parser.prototype.toJSON = function () {
  return JSON.stringify(this.tree);
};

module.exports = { Parser: Parser };
}());

},{"./parser-extended.peg.js":4,"./parser.peg.js":5}],4:[function(require,module,exports){
(function () { var parser = (function(){
  /* Generated by PEG.js 0.6.2 (http://pegjs.majda.cz/). */
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "ALPHA": parse_ALPHA,
        "BIT": parse_BIT,
        "CHAR": parse_CHAR,
        "CR": parse_CR,
        "CRLF": parse_CRLF,
        "CTL": parse_CTL,
        "DIGIT": parse_DIGIT,
        "DQUOTE": parse_DQUOTE,
        "HEXDIG": parse_HEXDIG,
        "HTAB": parse_HTAB,
        "LF": parse_LF,
        "LWSP": parse_LWSP,
        "OCTET": parse_OCTET,
        "SP": parse_SP,
        "URI": parse_URI,
        "VCHAR": parse_VCHAR,
        "WSP": parse_WSP,
        "chapterTitle": parse_chapterTitle,
        "emojiName": parse_emojiName,
        "inlineInlineText": parse_inlineInlineText,
        "inlineInlineToken": parse_inlineInlineToken,
        "inlineInlineTokens": parse_inlineInlineTokens,
        "inlineText": parse_inlineText,
        "inlineToken": parse_inlineToken,
        "inlineTokens": parse_inlineTokens,
        "integer": parse_integer,
        "jumpuriTitle": parse_jumpuriTitle,
        "newLine": parse_newLine,
        "novel": parse_novel,
        "numeric": parse_numeric,
        "percent_token": parse_percent_token,
        "tag": parse_tag,
        "tagChapter": parse_tagChapter,
        "tagEmoji": parse_tagEmoji,
        "tagJump": parse_tagJump,
        "tagJumpuri": parse_tagJumpuri,
        "tagNewpage": parse_tagNewpage,
        "tagPixivimage": parse_tagPixivimage,
        "tagRuby": parse_tagRuby,
        "tagStrong": parse_tagStrong,
        "text": parse_text,
        "uri_chrs": parse_uri_chrs
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "novel";
      }
      
      var pos = 0;
      var reportMatchFailures = true;
      var rightmostMatchFailuresPos = 0;
      var rightmostMatchFailuresExpected = [];
      var cache = {};
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        
        if (charCode <= 0xFF) {
          var escapeChar = 'x';
          var length = 2;
        } else {
          var escapeChar = 'u';
          var length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function quote(s) {
        /*
         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
         * string literal except for the closing quote character, backslash,
         * carriage return, line separator, paragraph separator, and line feed.
         * Any character may appear in the form of an escape sequence.
         */
        return '"' + s
          .replace(/\\/g, '\\\\')            // backslash
          .replace(/"/g, '\\"')              // closing quote character
          .replace(/\r/g, '\\r')             // carriage return
          .replace(/\n/g, '\\n')             // line feed
          .replace(/[\x80-\uFFFF]/g, escape) // non-ASCII characters
          + '"';
      }
      
      function matchFailed(failure) {
        if (pos < rightmostMatchFailuresPos) {
          return;
        }
        
        if (pos > rightmostMatchFailuresPos) {
          rightmostMatchFailuresPos = pos;
          rightmostMatchFailuresExpected = [];
        }
        
        rightmostMatchFailuresExpected.push(failure);
      }
      
      function parse_novel() {
        var cacheKey = 'novel@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result0 = [];
        var result3 = parse_tag();
        if (result3 !== null) {
          var result1 = result3;
        } else {
          var result2 = parse_text();
          if (result2 !== null) {
            var result1 = result2;
          } else {
            var result1 = null;;
          };
        }
        while (result1 !== null) {
          result0.push(result1);
          var result3 = parse_tag();
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result2 = parse_text();
            if (result2 !== null) {
              var result1 = result2;
            } else {
              var result1 = null;;
            };
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_text() {
        var cacheKey = 'text@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
          var result17 = input.charAt(pos);
          pos++;
        } else {
          var result17 = null;
          if (reportMatchFailures) {
            matchFailed("[^[\\r\\n]");
          }
        }
        if (result17 !== null) {
          var result16 = [];
          while (result17 !== null) {
            result16.push(result17);
            if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
              var result17 = input.charAt(pos);
              pos++;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\r\\n]");
              }
            }
          }
        } else {
          var result16 = null;
        }
        if (result16 !== null) {
          var result3 = result16;
        } else {
          var savedPos4 = pos;
          var savedPos5 = pos;
          var savedReportMatchFailuresVar2 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos6 = pos;
          var savedReportMatchFailuresVar3 = reportMatchFailures;
          reportMatchFailures = false;
          var result15 = parse_tag();
          reportMatchFailures = savedReportMatchFailuresVar3;
          if (result15 === null) {
            var result14 = '';
          } else {
            var result14 = null;
            pos = savedPos6;
          }
          reportMatchFailures = savedReportMatchFailuresVar2;
          if (result14 !== null) {
            var result12 = '';
            pos = savedPos5;
          } else {
            var result12 = null;
          }
          if (result12 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result13 = "[";
              pos += 1;
            } else {
              var result13 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result13 !== null) {
              var result11 = [result12, result13];
            } else {
              var result11 = null;
              pos = savedPos4;
            }
          } else {
            var result11 = null;
            pos = savedPos4;
          }
          if (result11 !== null) {
            var result3 = result11;
          } else {
            var savedPos1 = pos;
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            var savedPos3 = pos;
            var savedReportMatchFailuresVar1 = reportMatchFailures;
            reportMatchFailures = false;
            var result10 = parse_tagNewpage();
            if (result10 !== null) {
              var result8 = result10;
            } else {
              var result9 = parse_tagChapter();
              if (result9 !== null) {
                var result8 = result9;
              } else {
                var result8 = null;;
              };
            }
            reportMatchFailures = savedReportMatchFailuresVar1;
            if (result8 === null) {
              var result7 = '';
            } else {
              var result7 = null;
              pos = savedPos3;
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if (result7 !== null) {
              var result5 = '';
              pos = savedPos2;
            } else {
              var result5 = null;
            }
            if (result5 !== null) {
              var result6 = parse_newLine();
              if (result6 !== null) {
                var result4 = [result5, result6];
              } else {
                var result4 = null;
                pos = savedPos1;
              }
            } else {
              var result4 = null;
              pos = savedPos1;
            }
            if (result4 !== null) {
              var result3 = result4;
            } else {
              var result3 = null;;
            };
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
              var result17 = input.charAt(pos);
              pos++;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\r\\n]");
              }
            }
            if (result17 !== null) {
              var result16 = [];
              while (result17 !== null) {
                result16.push(result17);
                if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
                  var result17 = input.charAt(pos);
                  pos++;
                } else {
                  var result17 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[\\r\\n]");
                  }
                }
              }
            } else {
              var result16 = null;
            }
            if (result16 !== null) {
              var result3 = result16;
            } else {
              var savedPos4 = pos;
              var savedPos5 = pos;
              var savedReportMatchFailuresVar2 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos6 = pos;
              var savedReportMatchFailuresVar3 = reportMatchFailures;
              reportMatchFailures = false;
              var result15 = parse_tag();
              reportMatchFailures = savedReportMatchFailuresVar3;
              if (result15 === null) {
                var result14 = '';
              } else {
                var result14 = null;
                pos = savedPos6;
              }
              reportMatchFailures = savedReportMatchFailuresVar2;
              if (result14 !== null) {
                var result12 = '';
                pos = savedPos5;
              } else {
                var result12 = null;
              }
              if (result12 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result13 = "[";
                  pos += 1;
                } else {
                  var result13 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result13 !== null) {
                  var result11 = [result12, result13];
                } else {
                  var result11 = null;
                  pos = savedPos4;
                }
              } else {
                var result11 = null;
                pos = savedPos4;
              }
              if (result11 !== null) {
                var result3 = result11;
              } else {
                var savedPos1 = pos;
                var savedPos2 = pos;
                var savedReportMatchFailuresVar0 = reportMatchFailures;
                reportMatchFailures = false;
                var savedPos3 = pos;
                var savedReportMatchFailuresVar1 = reportMatchFailures;
                reportMatchFailures = false;
                var result10 = parse_tagNewpage();
                if (result10 !== null) {
                  var result8 = result10;
                } else {
                  var result9 = parse_tagChapter();
                  if (result9 !== null) {
                    var result8 = result9;
                  } else {
                    var result8 = null;;
                  };
                }
                reportMatchFailures = savedReportMatchFailuresVar1;
                if (result8 === null) {
                  var result7 = '';
                } else {
                  var result7 = null;
                  pos = savedPos3;
                }
                reportMatchFailures = savedReportMatchFailuresVar0;
                if (result7 !== null) {
                  var result5 = '';
                  pos = savedPos2;
                } else {
                  var result5 = null;
                }
                if (result5 !== null) {
                  var result6 = parse_newLine();
                  if (result6 !== null) {
                    var result4 = [result5, result6];
                  } else {
                    var result4 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
                if (result4 !== null) {
                  var result3 = result4;
                } else {
                  var result3 = null;;
                };
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            var ret = '';
            for (var i = 0; i < chars.length; i++) {
              ret += chars[i].join('');
            }
            return text(ret);
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineText() {
        var cacheKey = 'inlineText@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[^[\]]/) !== null) {
          var result10 = input.charAt(pos);
          pos++;
        } else {
          var result10 = null;
          if (reportMatchFailures) {
            matchFailed("[^[\\]]");
          }
        }
        if (result10 !== null) {
          var result9 = [];
          while (result10 !== null) {
            result9.push(result10);
            if (input.substr(pos).match(/^[^[\]]/) !== null) {
              var result10 = input.charAt(pos);
              pos++;
            } else {
              var result10 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\]]");
              }
            }
          }
        } else {
          var result9 = null;
        }
        if (result9 !== null) {
          var result3 = result9;
        } else {
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos3 = pos;
          var savedReportMatchFailuresVar1 = reportMatchFailures;
          reportMatchFailures = false;
          var result8 = parse_tagRuby();
          reportMatchFailures = savedReportMatchFailuresVar1;
          if (result8 === null) {
            var result7 = '';
          } else {
            var result7 = null;
            pos = savedPos3;
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if (result7 !== null) {
            var result5 = '';
            pos = savedPos2;
          } else {
            var result5 = null;
          }
          if (result5 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result6 = "[";
              pos += 1;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result6 !== null) {
              var result4 = [result5, result6];
            } else {
              var result4 = null;
              pos = savedPos1;
            }
          } else {
            var result4 = null;
            pos = savedPos1;
          }
          if (result4 !== null) {
            var result3 = result4;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            if (input.substr(pos).match(/^[^[\]]/) !== null) {
              var result10 = input.charAt(pos);
              pos++;
            } else {
              var result10 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\]]");
              }
            }
            if (result10 !== null) {
              var result9 = [];
              while (result10 !== null) {
                result9.push(result10);
                if (input.substr(pos).match(/^[^[\]]/) !== null) {
                  var result10 = input.charAt(pos);
                  pos++;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[\\]]");
                  }
                }
              }
            } else {
              var result9 = null;
            }
            if (result9 !== null) {
              var result3 = result9;
            } else {
              var savedPos1 = pos;
              var savedPos2 = pos;
              var savedReportMatchFailuresVar0 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos3 = pos;
              var savedReportMatchFailuresVar1 = reportMatchFailures;
              reportMatchFailures = false;
              var result8 = parse_tagRuby();
              reportMatchFailures = savedReportMatchFailuresVar1;
              if (result8 === null) {
                var result7 = '';
              } else {
                var result7 = null;
                pos = savedPos3;
              }
              reportMatchFailures = savedReportMatchFailuresVar0;
              if (result7 !== null) {
                var result5 = '';
                pos = savedPos2;
              } else {
                var result5 = null;
              }
              if (result5 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result6 = "[";
                  pos += 1;
                } else {
                  var result6 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result6 !== null) {
                  var result4 = [result5, result6];
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
              } else {
                var result4 = null;
                pos = savedPos1;
              }
              if (result4 !== null) {
                var result3 = result4;
              } else {
                var result3 = null;;
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            return text(trim(serialize(chars).join('')));
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineToken() {
        var cacheKey = 'inlineToken@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_tagRuby();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_inlineText();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineTokens() {
        var cacheKey = 'inlineTokens@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result1 = parse_inlineToken();
        if (result1 !== null) {
          var result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            var result1 = parse_inlineToken();
          }
        } else {
          var result0 = null;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineText() {
        var cacheKey = 'inlineInlineText@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos4 = pos;
        if (input.substr(pos).match(/^[^[>]/) !== null) {
          var result14 = input.charAt(pos);
          pos++;
        } else {
          var result14 = null;
          if (reportMatchFailures) {
            matchFailed("[^[>]");
          }
        }
        if (result14 !== null) {
          var result10 = [];
          while (result14 !== null) {
            result10.push(result14);
            if (input.substr(pos).match(/^[^[>]/) !== null) {
              var result14 = input.charAt(pos);
              pos++;
            } else {
              var result14 = null;
              if (reportMatchFailures) {
                matchFailed("[^[>]");
              }
            }
          }
        } else {
          var result10 = null;
        }
        if (result10 !== null) {
          var savedPos5 = pos;
          var savedReportMatchFailuresVar2 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos6 = pos;
          var savedReportMatchFailuresVar3 = reportMatchFailures;
          reportMatchFailures = false;
          if (input.substr(pos, 2) === "]]") {
            var result13 = "]]";
            pos += 2;
          } else {
            var result13 = null;
            if (reportMatchFailures) {
              matchFailed("\"]]\"");
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar3;
          if (result13 === null) {
            var result12 = '';
          } else {
            var result12 = null;
            pos = savedPos6;
          }
          reportMatchFailures = savedReportMatchFailuresVar2;
          if (result12 !== null) {
            var result11 = '';
            pos = savedPos5;
          } else {
            var result11 = null;
          }
          if (result11 !== null) {
            var result9 = [result10, result11];
          } else {
            var result9 = null;
            pos = savedPos4;
          }
        } else {
          var result9 = null;
          pos = savedPos4;
        }
        if (result9 !== null) {
          var result3 = result9;
        } else {
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos3 = pos;
          var savedReportMatchFailuresVar1 = reportMatchFailures;
          reportMatchFailures = false;
          var result8 = parse_tagRuby();
          reportMatchFailures = savedReportMatchFailuresVar1;
          if (result8 === null) {
            var result7 = '';
          } else {
            var result7 = null;
            pos = savedPos3;
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if (result7 !== null) {
            var result5 = '';
            pos = savedPos2;
          } else {
            var result5 = null;
          }
          if (result5 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result6 = "[";
              pos += 1;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result6 !== null) {
              var result4 = [result5, result6];
            } else {
              var result4 = null;
              pos = savedPos1;
            }
          } else {
            var result4 = null;
            pos = savedPos1;
          }
          if (result4 !== null) {
            var result3 = result4;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var savedPos4 = pos;
            if (input.substr(pos).match(/^[^[>]/) !== null) {
              var result14 = input.charAt(pos);
              pos++;
            } else {
              var result14 = null;
              if (reportMatchFailures) {
                matchFailed("[^[>]");
              }
            }
            if (result14 !== null) {
              var result10 = [];
              while (result14 !== null) {
                result10.push(result14);
                if (input.substr(pos).match(/^[^[>]/) !== null) {
                  var result14 = input.charAt(pos);
                  pos++;
                } else {
                  var result14 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[>]");
                  }
                }
              }
            } else {
              var result10 = null;
            }
            if (result10 !== null) {
              var savedPos5 = pos;
              var savedReportMatchFailuresVar2 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos6 = pos;
              var savedReportMatchFailuresVar3 = reportMatchFailures;
              reportMatchFailures = false;
              if (input.substr(pos, 2) === "]]") {
                var result13 = "]]";
                pos += 2;
              } else {
                var result13 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]]\"");
                }
              }
              reportMatchFailures = savedReportMatchFailuresVar3;
              if (result13 === null) {
                var result12 = '';
              } else {
                var result12 = null;
                pos = savedPos6;
              }
              reportMatchFailures = savedReportMatchFailuresVar2;
              if (result12 !== null) {
                var result11 = '';
                pos = savedPos5;
              } else {
                var result11 = null;
              }
              if (result11 !== null) {
                var result9 = [result10, result11];
              } else {
                var result9 = null;
                pos = savedPos4;
              }
            } else {
              var result9 = null;
              pos = savedPos4;
            }
            if (result9 !== null) {
              var result3 = result9;
            } else {
              var savedPos1 = pos;
              var savedPos2 = pos;
              var savedReportMatchFailuresVar0 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos3 = pos;
              var savedReportMatchFailuresVar1 = reportMatchFailures;
              reportMatchFailures = false;
              var result8 = parse_tagRuby();
              reportMatchFailures = savedReportMatchFailuresVar1;
              if (result8 === null) {
                var result7 = '';
              } else {
                var result7 = null;
                pos = savedPos3;
              }
              reportMatchFailures = savedReportMatchFailuresVar0;
              if (result7 !== null) {
                var result5 = '';
                pos = savedPos2;
              } else {
                var result5 = null;
              }
              if (result5 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result6 = "[";
                  pos += 1;
                } else {
                  var result6 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result6 !== null) {
                  var result4 = [result5, result6];
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
              } else {
                var result4 = null;
                pos = savedPos1;
              }
              if (result4 !== null) {
                var result3 = result4;
              } else {
                var result3 = null;;
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            return text(trim(serialize(chars).join('')));
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineToken() {
        var cacheKey = 'inlineInlineToken@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_tagRuby();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_inlineInlineText();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineTokens() {
        var cacheKey = 'inlineInlineTokens@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result1 = parse_inlineInlineToken();
        if (result1 !== null) {
          var result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            var result1 = parse_inlineInlineToken();
          }
        } else {
          var result0 = null;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tag() {
        var cacheKey = 'tag@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result8 = parse_tagNewpage();
        if (result8 !== null) {
          var result0 = result8;
        } else {
          var result7 = parse_tagChapter();
          if (result7 !== null) {
            var result0 = result7;
          } else {
            var result6 = parse_tagPixivimage();
            if (result6 !== null) {
              var result0 = result6;
            } else {
              var result5 = parse_tagJump();
              if (result5 !== null) {
                var result0 = result5;
              } else {
                var result4 = parse_tagJumpuri();
                if (result4 !== null) {
                  var result0 = result4;
                } else {
                  var result3 = parse_tagRuby();
                  if (result3 !== null) {
                    var result0 = result3;
                  } else {
                    var result2 = parse_tagEmoji();
                    if (result2 !== null) {
                      var result0 = result2;
                    } else {
                      var result1 = parse_tagStrong();
                      if (result1 !== null) {
                        var result0 = result1;
                      } else {
                        var result0 = null;;
                      };
                    };
                  };
                };
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagNewpage() {
        var cacheKey = 'tagNewpage@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result7 = parse_newLine();
        var result3 = result7 !== null ? result7 : '';
        if (result3 !== null) {
          if (input.substr(pos, 9) === "[newpage]") {
            var result4 = "[newpage]";
            pos += 9;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"[newpage]\"");
            }
          }
          if (result4 !== null) {
            var result6 = parse_newLine();
            var result5 = result6 !== null ? result6 : '';
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function() { return tagNewpage(); })()
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagChapter() {
        var cacheKey = 'tagChapter@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result9 = parse_newLine();
        var result3 = result9 !== null ? result9 : '';
        if (result3 !== null) {
          if (input.substr(pos, 9) === "[chapter:") {
            var result4 = "[chapter:";
            pos += 9;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"[chapter:\"");
            }
          }
          if (result4 !== null) {
            var result5 = parse_inlineTokens();
            if (result5 !== null) {
              if (input.substr(pos, 1) === "]") {
                var result6 = "]";
                pos += 1;
              } else {
                var result6 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]\"");
                }
              }
              if (result6 !== null) {
                var result8 = parse_newLine();
                var result7 = result8 !== null ? result8 : '';
                if (result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7];
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(title) { return tagChapter(title); })(result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagPixivimage() {
        var cacheKey = 'tagPixivimage@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 12) === "[pixivimage:") {
          var result3 = "[pixivimage:";
          pos += 12;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[pixivimage:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_numeric();
          if (result4 !== null) {
            var savedPos2 = pos;
            if (input.substr(pos, 1) === "-") {
              var result8 = "-";
              pos += 1;
            } else {
              var result8 = null;
              if (reportMatchFailures) {
                matchFailed("\"-\"");
              }
            }
            if (result8 !== null) {
              var result9 = parse_integer();
              if (result9 !== null) {
                var result7 = [result8, result9];
              } else {
                var result7 = null;
                pos = savedPos2;
              }
            } else {
              var result7 = null;
              pos = savedPos2;
            }
            var result5 = result7 !== null ? result7 : '';
            if (result5 !== null) {
              if (input.substr(pos, 1) === "]") {
                var result6 = "]";
                pos += 1;
              } else {
                var result6 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]\"");
                }
              }
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(illustID, pageNumber) {
              return tagPixivimage(illustID, pageNumber && pageNumber[1]);
            })(result1[1], result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagJump() {
        var cacheKey = 'tagJump@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 6) === "[jump:") {
          var result3 = "[jump:";
          pos += 6;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[jump:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_integer();
          if (result4 !== null) {
            if (input.substr(pos, 1) === "]") {
              var result5 = "]";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"]\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(pageNumber) { return tagJump(pageNumber); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagJumpuri() {
        var cacheKey = 'tagJumpuri@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 10) === "[[jumpuri:") {
          var result3 = "[[jumpuri:";
          pos += 10;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[[jumpuri:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_inlineInlineTokens();
          if (result4 !== null) {
            if (input.substr(pos, 1) === ">") {
              var result5 = ">";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\">\"");
              }
            }
            if (result5 !== null) {
              var result6 = [];
              var result11 = parse_WSP();
              while (result11 !== null) {
                result6.push(result11);
                var result11 = parse_WSP();
              }
              if (result6 !== null) {
                var result7 = parse_URI();
                if (result7 !== null) {
                  var result8 = [];
                  var result10 = parse_WSP();
                  while (result10 !== null) {
                    result8.push(result10);
                    var result10 = parse_WSP();
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 2) === "]]") {
                      var result9 = "]]";
                      pos += 2;
                    } else {
                      var result9 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"]]\"");
                      }
                    }
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(jumpuriTitle, uri) {
              return tagJumpuri(jumpuriTitle, uri);
            })(result1[1], result1[4])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_chapterTitle() {
        var cacheKey = 'chapterTitle@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        if (input.substr(pos).match(/^[^\]]/) !== null) {
          var result3 = input.charAt(pos);
          pos++;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("[^\\]]");
          }
        }
        while (result3 !== null) {
          result1.push(result3);
          if (input.substr(pos).match(/^[^\]]/) !== null) {
            var result3 = input.charAt(pos);
            pos++;
          } else {
            var result3 = null;
            if (reportMatchFailures) {
              matchFailed("[^\\]]");
            }
          }
        }
        var result2 = result1 !== null
          ? (function(title) { return trim(title.join('')); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_jumpuriTitle() {
        var cacheKey = 'jumpuriTitle@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        if (input.substr(pos).match(/^[^>]/) !== null) {
          var result3 = input.charAt(pos);
          pos++;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("[^>]");
          }
        }
        while (result3 !== null) {
          result1.push(result3);
          if (input.substr(pos).match(/^[^>]/) !== null) {
            var result3 = input.charAt(pos);
            pos++;
          } else {
            var result3 = null;
            if (reportMatchFailures) {
              matchFailed("[^>]");
            }
          }
        }
        var result2 = result1 !== null
          ? (function(title) { return trim(title.join('')); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_numeric() {
        var cacheKey = 'numeric@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result3 = parse_DIGIT();
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var result3 = parse_DIGIT();
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(digits) { return digits.join(''); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_integer() {
        var cacheKey = 'integer@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result3 = parse_DIGIT();
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var result3 = parse_DIGIT();
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(digits) { return parseInt(digits.join(''), 10); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_URI() {
        var cacheKey = 'URI@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var savedPos2 = pos;
        if (input.substr(pos, 4) === "http") {
          var result6 = "http";
          pos += 4;
        } else {
          var result6 = null;
          if (reportMatchFailures) {
            matchFailed("\"http\"");
          }
        }
        if (result6 !== null) {
          if (input.substr(pos, 1) === "s") {
            var result9 = "s";
            pos += 1;
          } else {
            var result9 = null;
            if (reportMatchFailures) {
              matchFailed("\"s\"");
            }
          }
          var result7 = result9 !== null ? result9 : '';
          if (result7 !== null) {
            if (input.substr(pos, 3) === "://") {
              var result8 = "://";
              pos += 3;
            } else {
              var result8 = null;
              if (reportMatchFailures) {
                matchFailed("\"://\"");
              }
            }
            if (result8 !== null) {
              var result3 = [result6, result7, result8];
            } else {
              var result3 = null;
              pos = savedPos2;
            }
          } else {
            var result3 = null;
            pos = savedPos2;
          }
        } else {
          var result3 = null;
          pos = savedPos2;
        }
        if (result3 !== null) {
          var result4 = [];
          var result5 = parse_uri_chrs();
          while (result5 !== null) {
            result4.push(result5);
            var result5 = parse_uri_chrs();
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(scheme, chars) { return scheme.join('') + chars.join(''); })(result1[0], result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_uri_chrs() {
        var cacheKey = 'uri_chrs@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result4 = parse_ALPHA();
        if (result4 !== null) {
          var result0 = result4;
        } else {
          var result3 = parse_DIGIT();
          if (result3 !== null) {
            var result0 = result3;
          } else {
            var result2 = parse_percent_token();
            if (result2 !== null) {
              var result0 = result2;
            } else {
              if (input.substr(pos).match(/^[\-._~!$&'()*+,;=:\/@.?#]/) !== null) {
                var result1 = input.charAt(pos);
                pos++;
              } else {
                var result1 = null;
                if (reportMatchFailures) {
                  matchFailed("[\\-._~!$&'()*+,;=:\\/@.?#]");
                }
              }
              if (result1 !== null) {
                var result0 = result1;
              } else {
                var result0 = null;;
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_percent_token() {
        var cacheKey = 'percent_token@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "%") {
          var result3 = "%";
          pos += 1;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"%\"");
          }
        }
        if (result3 !== null) {
          var result5 = parse_HEXDIG();
          if (result5 !== null) {
            var result4 = [];
            while (result5 !== null) {
              result4.push(result5);
              var result5 = parse_HEXDIG();
            }
          } else {
            var result4 = null;
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(hexdig) { return '%' + hexdig.join(''); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagRuby() {
        var cacheKey = 'tagRuby@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 5) === "[[rb:") {
          var result3 = "[[rb:";
          pos += 5;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[[rb:\"");
          }
        }
        if (result3 !== null) {
          var result4 = [];
          if (input.substr(pos).match(/^[^>]/) !== null) {
            var result16 = input.charAt(pos);
            pos++;
          } else {
            var result16 = null;
            if (reportMatchFailures) {
              matchFailed("[^>]");
            }
          }
          while (result16 !== null) {
            result4.push(result16);
            if (input.substr(pos).match(/^[^>]/) !== null) {
              var result16 = input.charAt(pos);
              pos++;
            } else {
              var result16 = null;
              if (reportMatchFailures) {
                matchFailed("[^>]");
              }
            }
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === ">") {
              var result5 = ">";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\">\"");
              }
            }
            if (result5 !== null) {
              var result6 = [];
              if (input.substr(pos).match(/^[^\]]/) !== null) {
                var result15 = input.charAt(pos);
                pos++;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("[^\\]]");
                }
              }
              if (result15 !== null) {
                var result14 = [];
                while (result15 !== null) {
                  result14.push(result15);
                  if (input.substr(pos).match(/^[^\]]/) !== null) {
                    var result15 = input.charAt(pos);
                    pos++;
                  } else {
                    var result15 = null;
                    if (reportMatchFailures) {
                      matchFailed("[^\\]]");
                    }
                  }
                }
              } else {
                var result14 = null;
              }
              if (result14 !== null) {
                var result8 = result14;
              } else {
                var savedPos2 = pos;
                if (input.substr(pos, 1) === "]") {
                  var result10 = "]";
                  pos += 1;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"]\"");
                  }
                }
                if (result10 !== null) {
                  var savedPos3 = pos;
                  var savedReportMatchFailuresVar0 = reportMatchFailures;
                  reportMatchFailures = false;
                  var savedPos4 = pos;
                  var savedReportMatchFailuresVar1 = reportMatchFailures;
                  reportMatchFailures = false;
                  if (input.substr(pos, 1) === "]") {
                    var result13 = "]";
                    pos += 1;
                  } else {
                    var result13 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"]\"");
                    }
                  }
                  reportMatchFailures = savedReportMatchFailuresVar1;
                  if (result13 === null) {
                    var result12 = '';
                  } else {
                    var result12 = null;
                    pos = savedPos4;
                  }
                  reportMatchFailures = savedReportMatchFailuresVar0;
                  if (result12 !== null) {
                    var result11 = '';
                    pos = savedPos3;
                  } else {
                    var result11 = null;
                  }
                  if (result11 !== null) {
                    var result9 = [result10, result11];
                  } else {
                    var result9 = null;
                    pos = savedPos2;
                  }
                } else {
                  var result9 = null;
                  pos = savedPos2;
                }
                if (result9 !== null) {
                  var result8 = result9;
                } else {
                  var result8 = null;;
                };
              }
              while (result8 !== null) {
                result6.push(result8);
                if (input.substr(pos).match(/^[^\]]/) !== null) {
                  var result15 = input.charAt(pos);
                  pos++;
                } else {
                  var result15 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^\\]]");
                  }
                }
                if (result15 !== null) {
                  var result14 = [];
                  while (result15 !== null) {
                    result14.push(result15);
                    if (input.substr(pos).match(/^[^\]]/) !== null) {
                      var result15 = input.charAt(pos);
                      pos++;
                    } else {
                      var result15 = null;
                      if (reportMatchFailures) {
                        matchFailed("[^\\]]");
                      }
                    }
                  }
                } else {
                  var result14 = null;
                }
                if (result14 !== null) {
                  var result8 = result14;
                } else {
                  var savedPos2 = pos;
                  if (input.substr(pos, 1) === "]") {
                    var result10 = "]";
                    pos += 1;
                  } else {
                    var result10 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"]\"");
                    }
                  }
                  if (result10 !== null) {
                    var savedPos3 = pos;
                    var savedReportMatchFailuresVar0 = reportMatchFailures;
                    reportMatchFailures = false;
                    var savedPos4 = pos;
                    var savedReportMatchFailuresVar1 = reportMatchFailures;
                    reportMatchFailures = false;
                    if (input.substr(pos, 1) === "]") {
                      var result13 = "]";
                      pos += 1;
                    } else {
                      var result13 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"]\"");
                      }
                    }
                    reportMatchFailures = savedReportMatchFailuresVar1;
                    if (result13 === null) {
                      var result12 = '';
                    } else {
                      var result12 = null;
                      pos = savedPos4;
                    }
                    reportMatchFailures = savedReportMatchFailuresVar0;
                    if (result12 !== null) {
                      var result11 = '';
                      pos = savedPos3;
                    } else {
                      var result11 = null;
                    }
                    if (result11 !== null) {
                      var result9 = [result10, result11];
                    } else {
                      var result9 = null;
                      pos = savedPos2;
                    }
                  } else {
                    var result9 = null;
                    pos = savedPos2;
                  }
                  if (result9 !== null) {
                    var result8 = result9;
                  } else {
                    var result8 = null;;
                  };
                }
              }
              if (result6 !== null) {
                if (input.substr(pos, 2) === "]]") {
                  var result7 = "]]";
                  pos += 2;
                } else {
                  var result7 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"]]\"");
                  }
                }
                if (result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7];
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(rubyBase, rubyText) {
              return tagRuby(trim(rubyBase.join('')), trim(serialize(rubyText).join('')));
            })(result1[1], result1[3])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagEmoji() {
        var cacheKey = 'tagEmoji@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 7) === "[emoji:") {
          var result3 = "[emoji:";
          pos += 7;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[emoji:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_emojiName();
          if (result4 !== null) {
            if (input.substr(pos, 1) === "]") {
              var result5 = "]";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"]\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(emojiName) { return tagEmoji(emojiName); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagStrong() {
        var cacheKey = 'tagStrong@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 8) === "[strong:") {
          var result3 = "[strong:";
          pos += 8;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[strong:\"");
          }
        }
        if (result3 !== null) {
          var result4 = [];
          if (input.substr(pos).match(/^[^\]]/) !== null) {
            var result6 = input.charAt(pos);
            pos++;
          } else {
            var result6 = null;
            if (reportMatchFailures) {
              matchFailed("[^\\]]");
            }
          }
          while (result6 !== null) {
            result4.push(result6);
            if (input.substr(pos).match(/^[^\]]/) !== null) {
              var result6 = input.charAt(pos);
              pos++;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("[^\\]]");
              }
            }
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === "]") {
              var result5 = "]";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"]\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(chars) { return tagStrong(trim(chars.join(''))); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_emojiName() {
        var cacheKey = 'emojiName@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result6 = parse_ALPHA();
        if (result6 !== null) {
          var result3 = result6;
        } else {
          var result5 = parse_DIGIT();
          if (result5 !== null) {
            var result3 = result5;
          } else {
            if (input.substr(pos, 1) === "-") {
              var result4 = "-";
              pos += 1;
            } else {
              var result4 = null;
              if (reportMatchFailures) {
                matchFailed("\"-\"");
              }
            }
            if (result4 !== null) {
              var result3 = result4;
            } else {
              var result3 = null;;
            };
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var result6 = parse_ALPHA();
            if (result6 !== null) {
              var result3 = result6;
            } else {
              var result5 = parse_DIGIT();
              if (result5 !== null) {
                var result3 = result5;
              } else {
                if (input.substr(pos, 1) === "-") {
                  var result4 = "-";
                  pos += 1;
                } else {
                  var result4 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"-\"");
                  }
                }
                if (result4 !== null) {
                  var result3 = result4;
                } else {
                  var result3 = null;;
                };
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(name) { return trim(name.join('')); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_newLine() {
        var cacheKey = 'newLine@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result5 = parse_LF();
        if (result5 !== null) {
          var result0 = result5;
        } else {
          var savedPos0 = pos;
          var result2 = parse_CR();
          if (result2 !== null) {
            var result4 = parse_LF();
            var result3 = result4 !== null ? result4 : '';
            if (result3 !== null) {
              var result1 = [result2, result3];
            } else {
              var result1 = null;
              pos = savedPos0;
            }
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_ALPHA() {
        var cacheKey = 'ALPHA@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[A-Z]/) !== null) {
          var result2 = input.charAt(pos);
          pos++;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("[A-Z]");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos).match(/^[a-z]/) !== null) {
            var result1 = input.charAt(pos);
            pos++;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("[a-z]");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_BIT() {
        var cacheKey = 'BIT@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "0") {
          var result2 = "0";
          pos += 1;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("\"0\"");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos, 1) === "1") {
            var result1 = "1";
            pos += 1;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("\"1\"");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CHAR() {
        var cacheKey = 'CHAR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[-]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[-]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CR() {
        var cacheKey = 'CR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "\r") {
          var result0 = "\r";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"\\r\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CRLF() {
        var cacheKey = 'CRLF@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = parse_CR();
        if (result1 !== null) {
          var result2 = parse_LF();
          if (result2 !== null) {
            var result0 = [result1, result2];
          } else {
            var result0 = null;
            pos = savedPos0;
          }
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CTL() {
        var cacheKey = 'CTL@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[\0-]/) !== null) {
          var result2 = input.charAt(pos);
          pos++;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("[\\0-]");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos, 1) === "") {
            var result1 = "";
            pos += 1;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("\"\"");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DIGIT() {
        var cacheKey = 'DIGIT@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[0-9]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[0-9]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DQUOTE() {
        var cacheKey = 'DQUOTE@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^["]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[\"]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_HEXDIG() {
        var cacheKey = 'HEXDIG@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result7 = parse_DIGIT();
        if (result7 !== null) {
          var result0 = result7;
        } else {
          if (input.substr(pos, 1) === "A") {
            var result6 = "A";
            pos += 1;
          } else {
            var result6 = null;
            if (reportMatchFailures) {
              matchFailed("\"A\"");
            }
          }
          if (result6 !== null) {
            var result0 = result6;
          } else {
            if (input.substr(pos, 1) === "B") {
              var result5 = "B";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"B\"");
              }
            }
            if (result5 !== null) {
              var result0 = result5;
            } else {
              if (input.substr(pos, 1) === "C") {
                var result4 = "C";
                pos += 1;
              } else {
                var result4 = null;
                if (reportMatchFailures) {
                  matchFailed("\"C\"");
                }
              }
              if (result4 !== null) {
                var result0 = result4;
              } else {
                if (input.substr(pos, 1) === "D") {
                  var result3 = "D";
                  pos += 1;
                } else {
                  var result3 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"D\"");
                  }
                }
                if (result3 !== null) {
                  var result0 = result3;
                } else {
                  if (input.substr(pos, 1) === "E") {
                    var result2 = "E";
                    pos += 1;
                  } else {
                    var result2 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"E\"");
                    }
                  }
                  if (result2 !== null) {
                    var result0 = result2;
                  } else {
                    if (input.substr(pos, 1) === "F") {
                      var result1 = "F";
                      pos += 1;
                    } else {
                      var result1 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"F\"");
                      }
                    }
                    if (result1 !== null) {
                      var result0 = result1;
                    } else {
                      var result0 = null;;
                    };
                  };
                };
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_HTAB() {
        var cacheKey = 'HTAB@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "	") {
          var result0 = "	";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"	\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LF() {
        var cacheKey = 'LF@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "\n") {
          var result0 = "\n";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"\\n\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LWSP() {
        var cacheKey = 'LWSP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result0 = [];
        var result5 = parse_WSP();
        if (result5 !== null) {
          var result1 = result5;
        } else {
          var savedPos0 = pos;
          var result3 = parse_CRLF();
          if (result3 !== null) {
            var result4 = parse_WSP();
            if (result4 !== null) {
              var result2 = [result3, result4];
            } else {
              var result2 = null;
              pos = savedPos0;
            }
          } else {
            var result2 = null;
            pos = savedPos0;
          }
          if (result2 !== null) {
            var result1 = result2;
          } else {
            var result1 = null;;
          };
        }
        while (result1 !== null) {
          result0.push(result1);
          var result5 = parse_WSP();
          if (result5 !== null) {
            var result1 = result5;
          } else {
            var savedPos0 = pos;
            var result3 = parse_CRLF();
            if (result3 !== null) {
              var result4 = parse_WSP();
              if (result4 !== null) {
                var result2 = [result3, result4];
              } else {
                var result2 = null;
                pos = savedPos0;
              }
            } else {
              var result2 = null;
              pos = savedPos0;
            }
            if (result2 !== null) {
              var result1 = result2;
            } else {
              var result1 = null;;
            };
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_OCTET() {
        var cacheKey = 'OCTET@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[\0-\xFF]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[\\0-\\xFF]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SP() {
        var cacheKey = 'SP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === " ") {
          var result0 = " ";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\" \"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_VCHAR() {
        var cacheKey = 'VCHAR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[!-~]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[!-~]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_WSP() {
        var cacheKey = 'WSP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_SP();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_HTAB();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function buildErrorMessage() {
        function buildExpected(failuresExpected) {
          failuresExpected.sort();
          
          var lastFailure = null;
          var failuresExpectedUnique = [];
          for (var i = 0; i < failuresExpected.length; i++) {
            if (failuresExpected[i] !== lastFailure) {
              failuresExpectedUnique.push(failuresExpected[i]);
              lastFailure = failuresExpected[i];
            }
          }
          
          switch (failuresExpectedUnique.length) {
            case 0:
              return 'end of input';
            case 1:
              return failuresExpectedUnique[0];
            default:
              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(', ')
                + ' or '
                + failuresExpectedUnique[failuresExpectedUnique.length - 1];
          }
        }
        
        var expected = buildExpected(rightmostMatchFailuresExpected);
        var actualPos = Math.max(pos, rightmostMatchFailuresPos);
        var actual = actualPos < input.length
          ? quote(input.charAt(actualPos))
          : 'end of input';
        
        return 'Expected ' + expected + ' but ' + actual + ' found.';
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i <  rightmostMatchFailuresPos; i++) {
          var ch = input.charAt(i);
          if (ch === '\n') {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === '\r' | ch === '\u2028' || ch === '\u2029') {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      
    function serialize(array) {
      
      var ret = [];
      
      for (var i = 0; i < array.length; i++) {
      
        if (typeof array[i] === 'object') {
      
          ret = ret.concat(serialize(array[i]));
      
        } else {
      
          ret.push(array[i]);
      
        }
      
      }
      
      return ret;
      
    }
      
  
      
    function trim(string) {
      
      return string.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      
    }
      
  
      
    function text(chars) {
      
      return { type: 'text', val: chars };
      
    }
      
  
      
    function tagNewpage() {
      
      return { type: 'tag', name: 'newpage' };
      
    }
      
  
      
    function tagChapter(title) {
      
      return { type: 'tag', name: 'chapter', title: title };
      
    }
      
  
      
    function tagPixivimage(illustID, pageNumber) {
      
      return {
      
        type: 'tag',
      
        name: 'pixivimage',
      
        illustID: illustID,
      
        pageNumber: pageNumber || null
      
      };
      
    }
      
  
      
    function tagJump(pageNumber) {
      
      return {
      
        type: 'tag',
      
        name: 'jump',
      
        pageNumber: pageNumber
      
      };
      
    }
      
  
      
    function tagJumpuri(title, uri) {
      
      return {
      
        type: 'tag',
      
        name: 'jumpuri',
      
        title: title,
      
        uri: uri
      
      };
      
    }
      
  
      
    function tagRuby(rubyBase, rubyText) {
      
      return {
      
        type: 'tag',
      
        name: 'rb',
      
        rubyBase: rubyBase,
      
        rubyText: rubyText
      
      };
      
    }
      
  
      
  // {{{!Extended
      
  
      
    function tagEmoji(emojiName) {
      
      return {
      
        type: 'tag',
      
        name: 'emoji',
      
        emojiName: emojiName
      
      };
      
    }
      
  
      
    function tagStrong(chars) {
      
      return {
      
        type: 'tag',
      
        name: 'strong',
      
        val: chars
      
      };
      
    }
      
  // }}}!Extended
      
  
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostMatchFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var errorPosition = computeErrorPosition();
        throw new this.SyntaxError(
          buildErrorMessage(),
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(message, line, column) {
    this.name = 'SyntaxError';
    this.message = message;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
module.exports = parser;
}());
},{}],5:[function(require,module,exports){
(function () { var parser = (function(){
  /* Generated by PEG.js 0.6.2 (http://pegjs.majda.cz/). */
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "ALPHA": parse_ALPHA,
        "BIT": parse_BIT,
        "CHAR": parse_CHAR,
        "CR": parse_CR,
        "CRLF": parse_CRLF,
        "CTL": parse_CTL,
        "DIGIT": parse_DIGIT,
        "DQUOTE": parse_DQUOTE,
        "HEXDIG": parse_HEXDIG,
        "HTAB": parse_HTAB,
        "LF": parse_LF,
        "LWSP": parse_LWSP,
        "OCTET": parse_OCTET,
        "SP": parse_SP,
        "URI": parse_URI,
        "VCHAR": parse_VCHAR,
        "WSP": parse_WSP,
        "chapterTitle": parse_chapterTitle,
        "inlineInlineText": parse_inlineInlineText,
        "inlineInlineToken": parse_inlineInlineToken,
        "inlineInlineTokens": parse_inlineInlineTokens,
        "inlineText": parse_inlineText,
        "inlineToken": parse_inlineToken,
        "inlineTokens": parse_inlineTokens,
        "integer": parse_integer,
        "jumpuriTitle": parse_jumpuriTitle,
        "newLine": parse_newLine,
        "novel": parse_novel,
        "numeric": parse_numeric,
        "percent_token": parse_percent_token,
        "tag": parse_tag,
        "tagChapter": parse_tagChapter,
        "tagJump": parse_tagJump,
        "tagJumpuri": parse_tagJumpuri,
        "tagNewpage": parse_tagNewpage,
        "tagPixivimage": parse_tagPixivimage,
        "tagRuby": parse_tagRuby,
        "text": parse_text,
        "uri_chrs": parse_uri_chrs
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "novel";
      }
      
      var pos = 0;
      var reportMatchFailures = true;
      var rightmostMatchFailuresPos = 0;
      var rightmostMatchFailuresExpected = [];
      var cache = {};
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        
        if (charCode <= 0xFF) {
          var escapeChar = 'x';
          var length = 2;
        } else {
          var escapeChar = 'u';
          var length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function quote(s) {
        /*
         * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
         * string literal except for the closing quote character, backslash,
         * carriage return, line separator, paragraph separator, and line feed.
         * Any character may appear in the form of an escape sequence.
         */
        return '"' + s
          .replace(/\\/g, '\\\\')            // backslash
          .replace(/"/g, '\\"')              // closing quote character
          .replace(/\r/g, '\\r')             // carriage return
          .replace(/\n/g, '\\n')             // line feed
          .replace(/[\x80-\uFFFF]/g, escape) // non-ASCII characters
          + '"';
      }
      
      function matchFailed(failure) {
        if (pos < rightmostMatchFailuresPos) {
          return;
        }
        
        if (pos > rightmostMatchFailuresPos) {
          rightmostMatchFailuresPos = pos;
          rightmostMatchFailuresExpected = [];
        }
        
        rightmostMatchFailuresExpected.push(failure);
      }
      
      function parse_novel() {
        var cacheKey = 'novel@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result0 = [];
        var result3 = parse_tag();
        if (result3 !== null) {
          var result1 = result3;
        } else {
          var result2 = parse_text();
          if (result2 !== null) {
            var result1 = result2;
          } else {
            var result1 = null;;
          };
        }
        while (result1 !== null) {
          result0.push(result1);
          var result3 = parse_tag();
          if (result3 !== null) {
            var result1 = result3;
          } else {
            var result2 = parse_text();
            if (result2 !== null) {
              var result1 = result2;
            } else {
              var result1 = null;;
            };
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_text() {
        var cacheKey = 'text@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
          var result17 = input.charAt(pos);
          pos++;
        } else {
          var result17 = null;
          if (reportMatchFailures) {
            matchFailed("[^[\\r\\n]");
          }
        }
        if (result17 !== null) {
          var result16 = [];
          while (result17 !== null) {
            result16.push(result17);
            if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
              var result17 = input.charAt(pos);
              pos++;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\r\\n]");
              }
            }
          }
        } else {
          var result16 = null;
        }
        if (result16 !== null) {
          var result3 = result16;
        } else {
          var savedPos4 = pos;
          var savedPos5 = pos;
          var savedReportMatchFailuresVar2 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos6 = pos;
          var savedReportMatchFailuresVar3 = reportMatchFailures;
          reportMatchFailures = false;
          var result15 = parse_tag();
          reportMatchFailures = savedReportMatchFailuresVar3;
          if (result15 === null) {
            var result14 = '';
          } else {
            var result14 = null;
            pos = savedPos6;
          }
          reportMatchFailures = savedReportMatchFailuresVar2;
          if (result14 !== null) {
            var result12 = '';
            pos = savedPos5;
          } else {
            var result12 = null;
          }
          if (result12 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result13 = "[";
              pos += 1;
            } else {
              var result13 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result13 !== null) {
              var result11 = [result12, result13];
            } else {
              var result11 = null;
              pos = savedPos4;
            }
          } else {
            var result11 = null;
            pos = savedPos4;
          }
          if (result11 !== null) {
            var result3 = result11;
          } else {
            var savedPos1 = pos;
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            var savedPos3 = pos;
            var savedReportMatchFailuresVar1 = reportMatchFailures;
            reportMatchFailures = false;
            var result10 = parse_tagNewpage();
            if (result10 !== null) {
              var result8 = result10;
            } else {
              var result9 = parse_tagChapter();
              if (result9 !== null) {
                var result8 = result9;
              } else {
                var result8 = null;;
              };
            }
            reportMatchFailures = savedReportMatchFailuresVar1;
            if (result8 === null) {
              var result7 = '';
            } else {
              var result7 = null;
              pos = savedPos3;
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if (result7 !== null) {
              var result5 = '';
              pos = savedPos2;
            } else {
              var result5 = null;
            }
            if (result5 !== null) {
              var result6 = parse_newLine();
              if (result6 !== null) {
                var result4 = [result5, result6];
              } else {
                var result4 = null;
                pos = savedPos1;
              }
            } else {
              var result4 = null;
              pos = savedPos1;
            }
            if (result4 !== null) {
              var result3 = result4;
            } else {
              var result3 = null;;
            };
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
              var result17 = input.charAt(pos);
              pos++;
            } else {
              var result17 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\r\\n]");
              }
            }
            if (result17 !== null) {
              var result16 = [];
              while (result17 !== null) {
                result16.push(result17);
                if (input.substr(pos).match(/^[^[\r\n]/) !== null) {
                  var result17 = input.charAt(pos);
                  pos++;
                } else {
                  var result17 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[\\r\\n]");
                  }
                }
              }
            } else {
              var result16 = null;
            }
            if (result16 !== null) {
              var result3 = result16;
            } else {
              var savedPos4 = pos;
              var savedPos5 = pos;
              var savedReportMatchFailuresVar2 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos6 = pos;
              var savedReportMatchFailuresVar3 = reportMatchFailures;
              reportMatchFailures = false;
              var result15 = parse_tag();
              reportMatchFailures = savedReportMatchFailuresVar3;
              if (result15 === null) {
                var result14 = '';
              } else {
                var result14 = null;
                pos = savedPos6;
              }
              reportMatchFailures = savedReportMatchFailuresVar2;
              if (result14 !== null) {
                var result12 = '';
                pos = savedPos5;
              } else {
                var result12 = null;
              }
              if (result12 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result13 = "[";
                  pos += 1;
                } else {
                  var result13 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result13 !== null) {
                  var result11 = [result12, result13];
                } else {
                  var result11 = null;
                  pos = savedPos4;
                }
              } else {
                var result11 = null;
                pos = savedPos4;
              }
              if (result11 !== null) {
                var result3 = result11;
              } else {
                var savedPos1 = pos;
                var savedPos2 = pos;
                var savedReportMatchFailuresVar0 = reportMatchFailures;
                reportMatchFailures = false;
                var savedPos3 = pos;
                var savedReportMatchFailuresVar1 = reportMatchFailures;
                reportMatchFailures = false;
                var result10 = parse_tagNewpage();
                if (result10 !== null) {
                  var result8 = result10;
                } else {
                  var result9 = parse_tagChapter();
                  if (result9 !== null) {
                    var result8 = result9;
                  } else {
                    var result8 = null;;
                  };
                }
                reportMatchFailures = savedReportMatchFailuresVar1;
                if (result8 === null) {
                  var result7 = '';
                } else {
                  var result7 = null;
                  pos = savedPos3;
                }
                reportMatchFailures = savedReportMatchFailuresVar0;
                if (result7 !== null) {
                  var result5 = '';
                  pos = savedPos2;
                } else {
                  var result5 = null;
                }
                if (result5 !== null) {
                  var result6 = parse_newLine();
                  if (result6 !== null) {
                    var result4 = [result5, result6];
                  } else {
                    var result4 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
                if (result4 !== null) {
                  var result3 = result4;
                } else {
                  var result3 = null;;
                };
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            var ret = '';
            for (var i = 0; i < chars.length; i++) {
              ret += chars[i].join('');
            }
            return text(ret);
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineText() {
        var cacheKey = 'inlineText@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        if (input.substr(pos).match(/^[^[\]]/) !== null) {
          var result10 = input.charAt(pos);
          pos++;
        } else {
          var result10 = null;
          if (reportMatchFailures) {
            matchFailed("[^[\\]]");
          }
        }
        if (result10 !== null) {
          var result9 = [];
          while (result10 !== null) {
            result9.push(result10);
            if (input.substr(pos).match(/^[^[\]]/) !== null) {
              var result10 = input.charAt(pos);
              pos++;
            } else {
              var result10 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\]]");
              }
            }
          }
        } else {
          var result9 = null;
        }
        if (result9 !== null) {
          var result3 = result9;
        } else {
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos3 = pos;
          var savedReportMatchFailuresVar1 = reportMatchFailures;
          reportMatchFailures = false;
          var result8 = parse_tagRuby();
          reportMatchFailures = savedReportMatchFailuresVar1;
          if (result8 === null) {
            var result7 = '';
          } else {
            var result7 = null;
            pos = savedPos3;
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if (result7 !== null) {
            var result5 = '';
            pos = savedPos2;
          } else {
            var result5 = null;
          }
          if (result5 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result6 = "[";
              pos += 1;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result6 !== null) {
              var result4 = [result5, result6];
            } else {
              var result4 = null;
              pos = savedPos1;
            }
          } else {
            var result4 = null;
            pos = savedPos1;
          }
          if (result4 !== null) {
            var result3 = result4;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            if (input.substr(pos).match(/^[^[\]]/) !== null) {
              var result10 = input.charAt(pos);
              pos++;
            } else {
              var result10 = null;
              if (reportMatchFailures) {
                matchFailed("[^[\\]]");
              }
            }
            if (result10 !== null) {
              var result9 = [];
              while (result10 !== null) {
                result9.push(result10);
                if (input.substr(pos).match(/^[^[\]]/) !== null) {
                  var result10 = input.charAt(pos);
                  pos++;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[\\]]");
                  }
                }
              }
            } else {
              var result9 = null;
            }
            if (result9 !== null) {
              var result3 = result9;
            } else {
              var savedPos1 = pos;
              var savedPos2 = pos;
              var savedReportMatchFailuresVar0 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos3 = pos;
              var savedReportMatchFailuresVar1 = reportMatchFailures;
              reportMatchFailures = false;
              var result8 = parse_tagRuby();
              reportMatchFailures = savedReportMatchFailuresVar1;
              if (result8 === null) {
                var result7 = '';
              } else {
                var result7 = null;
                pos = savedPos3;
              }
              reportMatchFailures = savedReportMatchFailuresVar0;
              if (result7 !== null) {
                var result5 = '';
                pos = savedPos2;
              } else {
                var result5 = null;
              }
              if (result5 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result6 = "[";
                  pos += 1;
                } else {
                  var result6 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result6 !== null) {
                  var result4 = [result5, result6];
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
              } else {
                var result4 = null;
                pos = savedPos1;
              }
              if (result4 !== null) {
                var result3 = result4;
              } else {
                var result3 = null;;
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            return text(trim(serialize(chars).join('')));
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineToken() {
        var cacheKey = 'inlineToken@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_tagRuby();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_inlineText();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineTokens() {
        var cacheKey = 'inlineTokens@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result1 = parse_inlineToken();
        if (result1 !== null) {
          var result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            var result1 = parse_inlineToken();
          }
        } else {
          var result0 = null;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineText() {
        var cacheKey = 'inlineInlineText@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos4 = pos;
        if (input.substr(pos).match(/^[^[>]/) !== null) {
          var result14 = input.charAt(pos);
          pos++;
        } else {
          var result14 = null;
          if (reportMatchFailures) {
            matchFailed("[^[>]");
          }
        }
        if (result14 !== null) {
          var result10 = [];
          while (result14 !== null) {
            result10.push(result14);
            if (input.substr(pos).match(/^[^[>]/) !== null) {
              var result14 = input.charAt(pos);
              pos++;
            } else {
              var result14 = null;
              if (reportMatchFailures) {
                matchFailed("[^[>]");
              }
            }
          }
        } else {
          var result10 = null;
        }
        if (result10 !== null) {
          var savedPos5 = pos;
          var savedReportMatchFailuresVar2 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos6 = pos;
          var savedReportMatchFailuresVar3 = reportMatchFailures;
          reportMatchFailures = false;
          if (input.substr(pos, 2) === "]]") {
            var result13 = "]]";
            pos += 2;
          } else {
            var result13 = null;
            if (reportMatchFailures) {
              matchFailed("\"]]\"");
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar3;
          if (result13 === null) {
            var result12 = '';
          } else {
            var result12 = null;
            pos = savedPos6;
          }
          reportMatchFailures = savedReportMatchFailuresVar2;
          if (result12 !== null) {
            var result11 = '';
            pos = savedPos5;
          } else {
            var result11 = null;
          }
          if (result11 !== null) {
            var result9 = [result10, result11];
          } else {
            var result9 = null;
            pos = savedPos4;
          }
        } else {
          var result9 = null;
          pos = savedPos4;
        }
        if (result9 !== null) {
          var result3 = result9;
        } else {
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var savedPos3 = pos;
          var savedReportMatchFailuresVar1 = reportMatchFailures;
          reportMatchFailures = false;
          var result8 = parse_tagRuby();
          reportMatchFailures = savedReportMatchFailuresVar1;
          if (result8 === null) {
            var result7 = '';
          } else {
            var result7 = null;
            pos = savedPos3;
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if (result7 !== null) {
            var result5 = '';
            pos = savedPos2;
          } else {
            var result5 = null;
          }
          if (result5 !== null) {
            if (input.substr(pos, 1) === "[") {
              var result6 = "[";
              pos += 1;
            } else {
              var result6 = null;
              if (reportMatchFailures) {
                matchFailed("\"[\"");
              }
            }
            if (result6 !== null) {
              var result4 = [result5, result6];
            } else {
              var result4 = null;
              pos = savedPos1;
            }
          } else {
            var result4 = null;
            pos = savedPos1;
          }
          if (result4 !== null) {
            var result3 = result4;
          } else {
            var result3 = null;;
          };
        }
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var savedPos4 = pos;
            if (input.substr(pos).match(/^[^[>]/) !== null) {
              var result14 = input.charAt(pos);
              pos++;
            } else {
              var result14 = null;
              if (reportMatchFailures) {
                matchFailed("[^[>]");
              }
            }
            if (result14 !== null) {
              var result10 = [];
              while (result14 !== null) {
                result10.push(result14);
                if (input.substr(pos).match(/^[^[>]/) !== null) {
                  var result14 = input.charAt(pos);
                  pos++;
                } else {
                  var result14 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^[>]");
                  }
                }
              }
            } else {
              var result10 = null;
            }
            if (result10 !== null) {
              var savedPos5 = pos;
              var savedReportMatchFailuresVar2 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos6 = pos;
              var savedReportMatchFailuresVar3 = reportMatchFailures;
              reportMatchFailures = false;
              if (input.substr(pos, 2) === "]]") {
                var result13 = "]]";
                pos += 2;
              } else {
                var result13 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]]\"");
                }
              }
              reportMatchFailures = savedReportMatchFailuresVar3;
              if (result13 === null) {
                var result12 = '';
              } else {
                var result12 = null;
                pos = savedPos6;
              }
              reportMatchFailures = savedReportMatchFailuresVar2;
              if (result12 !== null) {
                var result11 = '';
                pos = savedPos5;
              } else {
                var result11 = null;
              }
              if (result11 !== null) {
                var result9 = [result10, result11];
              } else {
                var result9 = null;
                pos = savedPos4;
              }
            } else {
              var result9 = null;
              pos = savedPos4;
            }
            if (result9 !== null) {
              var result3 = result9;
            } else {
              var savedPos1 = pos;
              var savedPos2 = pos;
              var savedReportMatchFailuresVar0 = reportMatchFailures;
              reportMatchFailures = false;
              var savedPos3 = pos;
              var savedReportMatchFailuresVar1 = reportMatchFailures;
              reportMatchFailures = false;
              var result8 = parse_tagRuby();
              reportMatchFailures = savedReportMatchFailuresVar1;
              if (result8 === null) {
                var result7 = '';
              } else {
                var result7 = null;
                pos = savedPos3;
              }
              reportMatchFailures = savedReportMatchFailuresVar0;
              if (result7 !== null) {
                var result5 = '';
                pos = savedPos2;
              } else {
                var result5 = null;
              }
              if (result5 !== null) {
                if (input.substr(pos, 1) === "[") {
                  var result6 = "[";
                  pos += 1;
                } else {
                  var result6 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"[\"");
                  }
                }
                if (result6 !== null) {
                  var result4 = [result5, result6];
                } else {
                  var result4 = null;
                  pos = savedPos1;
                }
              } else {
                var result4 = null;
                pos = savedPos1;
              }
              if (result4 !== null) {
                var result3 = result4;
              } else {
                var result3 = null;;
              };
            }
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(chars) {
            return text(trim(serialize(chars).join('')));
          })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineToken() {
        var cacheKey = 'inlineInlineToken@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_tagRuby();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_inlineInlineText();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_inlineInlineTokens() {
        var cacheKey = 'inlineInlineTokens@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result1 = parse_inlineInlineToken();
        if (result1 !== null) {
          var result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            var result1 = parse_inlineInlineToken();
          }
        } else {
          var result0 = null;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tag() {
        var cacheKey = 'tag@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result6 = parse_tagNewpage();
        if (result6 !== null) {
          var result0 = result6;
        } else {
          var result5 = parse_tagChapter();
          if (result5 !== null) {
            var result0 = result5;
          } else {
            var result4 = parse_tagPixivimage();
            if (result4 !== null) {
              var result0 = result4;
            } else {
              var result3 = parse_tagJump();
              if (result3 !== null) {
                var result0 = result3;
              } else {
                var result2 = parse_tagJumpuri();
                if (result2 !== null) {
                  var result0 = result2;
                } else {
                  var result1 = parse_tagRuby();
                  if (result1 !== null) {
                    var result0 = result1;
                  } else {
                    var result0 = null;;
                  };
                };
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagNewpage() {
        var cacheKey = 'tagNewpage@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result7 = parse_newLine();
        var result3 = result7 !== null ? result7 : '';
        if (result3 !== null) {
          if (input.substr(pos, 9) === "[newpage]") {
            var result4 = "[newpage]";
            pos += 9;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"[newpage]\"");
            }
          }
          if (result4 !== null) {
            var result6 = parse_newLine();
            var result5 = result6 !== null ? result6 : '';
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function() { return tagNewpage(); })()
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagChapter() {
        var cacheKey = 'tagChapter@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result9 = parse_newLine();
        var result3 = result9 !== null ? result9 : '';
        if (result3 !== null) {
          if (input.substr(pos, 9) === "[chapter:") {
            var result4 = "[chapter:";
            pos += 9;
          } else {
            var result4 = null;
            if (reportMatchFailures) {
              matchFailed("\"[chapter:\"");
            }
          }
          if (result4 !== null) {
            var result5 = parse_inlineTokens();
            if (result5 !== null) {
              if (input.substr(pos, 1) === "]") {
                var result6 = "]";
                pos += 1;
              } else {
                var result6 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]\"");
                }
              }
              if (result6 !== null) {
                var result8 = parse_newLine();
                var result7 = result8 !== null ? result8 : '';
                if (result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7];
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(title) { return tagChapter(title); })(result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagPixivimage() {
        var cacheKey = 'tagPixivimage@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 12) === "[pixivimage:") {
          var result3 = "[pixivimage:";
          pos += 12;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[pixivimage:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_numeric();
          if (result4 !== null) {
            var savedPos2 = pos;
            if (input.substr(pos, 1) === "-") {
              var result8 = "-";
              pos += 1;
            } else {
              var result8 = null;
              if (reportMatchFailures) {
                matchFailed("\"-\"");
              }
            }
            if (result8 !== null) {
              var result9 = parse_integer();
              if (result9 !== null) {
                var result7 = [result8, result9];
              } else {
                var result7 = null;
                pos = savedPos2;
              }
            } else {
              var result7 = null;
              pos = savedPos2;
            }
            var result5 = result7 !== null ? result7 : '';
            if (result5 !== null) {
              if (input.substr(pos, 1) === "]") {
                var result6 = "]";
                pos += 1;
              } else {
                var result6 = null;
                if (reportMatchFailures) {
                  matchFailed("\"]\"");
                }
              }
              if (result6 !== null) {
                var result1 = [result3, result4, result5, result6];
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(illustID, pageNumber) {
              return tagPixivimage(illustID, pageNumber && pageNumber[1]);
            })(result1[1], result1[2])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagJump() {
        var cacheKey = 'tagJump@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 6) === "[jump:") {
          var result3 = "[jump:";
          pos += 6;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[jump:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_integer();
          if (result4 !== null) {
            if (input.substr(pos, 1) === "]") {
              var result5 = "]";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"]\"");
              }
            }
            if (result5 !== null) {
              var result1 = [result3, result4, result5];
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(pageNumber) { return tagJump(pageNumber); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagJumpuri() {
        var cacheKey = 'tagJumpuri@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 10) === "[[jumpuri:") {
          var result3 = "[[jumpuri:";
          pos += 10;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[[jumpuri:\"");
          }
        }
        if (result3 !== null) {
          var result4 = parse_inlineInlineTokens();
          if (result4 !== null) {
            if (input.substr(pos, 1) === ">") {
              var result5 = ">";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\">\"");
              }
            }
            if (result5 !== null) {
              var result6 = [];
              var result11 = parse_WSP();
              while (result11 !== null) {
                result6.push(result11);
                var result11 = parse_WSP();
              }
              if (result6 !== null) {
                var result7 = parse_URI();
                if (result7 !== null) {
                  var result8 = [];
                  var result10 = parse_WSP();
                  while (result10 !== null) {
                    result8.push(result10);
                    var result10 = parse_WSP();
                  }
                  if (result8 !== null) {
                    if (input.substr(pos, 2) === "]]") {
                      var result9 = "]]";
                      pos += 2;
                    } else {
                      var result9 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"]]\"");
                      }
                    }
                    if (result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9];
                    } else {
                      var result1 = null;
                      pos = savedPos1;
                    }
                  } else {
                    var result1 = null;
                    pos = savedPos1;
                  }
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(jumpuriTitle, uri) {
              return tagJumpuri(jumpuriTitle, uri);
            })(result1[1], result1[4])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_chapterTitle() {
        var cacheKey = 'chapterTitle@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        if (input.substr(pos).match(/^[^\]]/) !== null) {
          var result3 = input.charAt(pos);
          pos++;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("[^\\]]");
          }
        }
        while (result3 !== null) {
          result1.push(result3);
          if (input.substr(pos).match(/^[^\]]/) !== null) {
            var result3 = input.charAt(pos);
            pos++;
          } else {
            var result3 = null;
            if (reportMatchFailures) {
              matchFailed("[^\\]]");
            }
          }
        }
        var result2 = result1 !== null
          ? (function(title) { return trim(title.join('')); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_jumpuriTitle() {
        var cacheKey = 'jumpuriTitle@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = [];
        if (input.substr(pos).match(/^[^>]/) !== null) {
          var result3 = input.charAt(pos);
          pos++;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("[^>]");
          }
        }
        while (result3 !== null) {
          result1.push(result3);
          if (input.substr(pos).match(/^[^>]/) !== null) {
            var result3 = input.charAt(pos);
            pos++;
          } else {
            var result3 = null;
            if (reportMatchFailures) {
              matchFailed("[^>]");
            }
          }
        }
        var result2 = result1 !== null
          ? (function(title) { return trim(title.join('')); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_numeric() {
        var cacheKey = 'numeric@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result3 = parse_DIGIT();
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var result3 = parse_DIGIT();
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(digits) { return digits.join(''); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_integer() {
        var cacheKey = 'integer@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result3 = parse_DIGIT();
        if (result3 !== null) {
          var result1 = [];
          while (result3 !== null) {
            result1.push(result3);
            var result3 = parse_DIGIT();
          }
        } else {
          var result1 = null;
        }
        var result2 = result1 !== null
          ? (function(digits) { return parseInt(digits.join(''), 10); })(result1)
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_URI() {
        var cacheKey = 'URI@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        var savedPos2 = pos;
        if (input.substr(pos, 4) === "http") {
          var result6 = "http";
          pos += 4;
        } else {
          var result6 = null;
          if (reportMatchFailures) {
            matchFailed("\"http\"");
          }
        }
        if (result6 !== null) {
          if (input.substr(pos, 1) === "s") {
            var result9 = "s";
            pos += 1;
          } else {
            var result9 = null;
            if (reportMatchFailures) {
              matchFailed("\"s\"");
            }
          }
          var result7 = result9 !== null ? result9 : '';
          if (result7 !== null) {
            if (input.substr(pos, 3) === "://") {
              var result8 = "://";
              pos += 3;
            } else {
              var result8 = null;
              if (reportMatchFailures) {
                matchFailed("\"://\"");
              }
            }
            if (result8 !== null) {
              var result3 = [result6, result7, result8];
            } else {
              var result3 = null;
              pos = savedPos2;
            }
          } else {
            var result3 = null;
            pos = savedPos2;
          }
        } else {
          var result3 = null;
          pos = savedPos2;
        }
        if (result3 !== null) {
          var result4 = [];
          var result5 = parse_uri_chrs();
          while (result5 !== null) {
            result4.push(result5);
            var result5 = parse_uri_chrs();
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(scheme, chars) { return scheme.join('') + chars.join(''); })(result1[0], result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_uri_chrs() {
        var cacheKey = 'uri_chrs@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result4 = parse_ALPHA();
        if (result4 !== null) {
          var result0 = result4;
        } else {
          var result3 = parse_DIGIT();
          if (result3 !== null) {
            var result0 = result3;
          } else {
            var result2 = parse_percent_token();
            if (result2 !== null) {
              var result0 = result2;
            } else {
              if (input.substr(pos).match(/^[\-._~!$&'()*+,;=:\/@.?#]/) !== null) {
                var result1 = input.charAt(pos);
                pos++;
              } else {
                var result1 = null;
                if (reportMatchFailures) {
                  matchFailed("[\\-._~!$&'()*+,;=:\\/@.?#]");
                }
              }
              if (result1 !== null) {
                var result0 = result1;
              } else {
                var result0 = null;;
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_percent_token() {
        var cacheKey = 'percent_token@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 1) === "%") {
          var result3 = "%";
          pos += 1;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"%\"");
          }
        }
        if (result3 !== null) {
          var result5 = parse_HEXDIG();
          if (result5 !== null) {
            var result4 = [];
            while (result5 !== null) {
              result4.push(result5);
              var result5 = parse_HEXDIG();
            }
          } else {
            var result4 = null;
          }
          if (result4 !== null) {
            var result1 = [result3, result4];
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(hexdig) { return '%' + hexdig.join(''); })(result1[1])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_tagRuby() {
        var cacheKey = 'tagRuby@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var savedPos1 = pos;
        if (input.substr(pos, 5) === "[[rb:") {
          var result3 = "[[rb:";
          pos += 5;
        } else {
          var result3 = null;
          if (reportMatchFailures) {
            matchFailed("\"[[rb:\"");
          }
        }
        if (result3 !== null) {
          var result4 = [];
          if (input.substr(pos).match(/^[^>]/) !== null) {
            var result16 = input.charAt(pos);
            pos++;
          } else {
            var result16 = null;
            if (reportMatchFailures) {
              matchFailed("[^>]");
            }
          }
          while (result16 !== null) {
            result4.push(result16);
            if (input.substr(pos).match(/^[^>]/) !== null) {
              var result16 = input.charAt(pos);
              pos++;
            } else {
              var result16 = null;
              if (reportMatchFailures) {
                matchFailed("[^>]");
              }
            }
          }
          if (result4 !== null) {
            if (input.substr(pos, 1) === ">") {
              var result5 = ">";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\">\"");
              }
            }
            if (result5 !== null) {
              var result6 = [];
              if (input.substr(pos).match(/^[^\]]/) !== null) {
                var result15 = input.charAt(pos);
                pos++;
              } else {
                var result15 = null;
                if (reportMatchFailures) {
                  matchFailed("[^\\]]");
                }
              }
              if (result15 !== null) {
                var result14 = [];
                while (result15 !== null) {
                  result14.push(result15);
                  if (input.substr(pos).match(/^[^\]]/) !== null) {
                    var result15 = input.charAt(pos);
                    pos++;
                  } else {
                    var result15 = null;
                    if (reportMatchFailures) {
                      matchFailed("[^\\]]");
                    }
                  }
                }
              } else {
                var result14 = null;
              }
              if (result14 !== null) {
                var result8 = result14;
              } else {
                var savedPos2 = pos;
                if (input.substr(pos, 1) === "]") {
                  var result10 = "]";
                  pos += 1;
                } else {
                  var result10 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"]\"");
                  }
                }
                if (result10 !== null) {
                  var savedPos3 = pos;
                  var savedReportMatchFailuresVar0 = reportMatchFailures;
                  reportMatchFailures = false;
                  var savedPos4 = pos;
                  var savedReportMatchFailuresVar1 = reportMatchFailures;
                  reportMatchFailures = false;
                  if (input.substr(pos, 1) === "]") {
                    var result13 = "]";
                    pos += 1;
                  } else {
                    var result13 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"]\"");
                    }
                  }
                  reportMatchFailures = savedReportMatchFailuresVar1;
                  if (result13 === null) {
                    var result12 = '';
                  } else {
                    var result12 = null;
                    pos = savedPos4;
                  }
                  reportMatchFailures = savedReportMatchFailuresVar0;
                  if (result12 !== null) {
                    var result11 = '';
                    pos = savedPos3;
                  } else {
                    var result11 = null;
                  }
                  if (result11 !== null) {
                    var result9 = [result10, result11];
                  } else {
                    var result9 = null;
                    pos = savedPos2;
                  }
                } else {
                  var result9 = null;
                  pos = savedPos2;
                }
                if (result9 !== null) {
                  var result8 = result9;
                } else {
                  var result8 = null;;
                };
              }
              while (result8 !== null) {
                result6.push(result8);
                if (input.substr(pos).match(/^[^\]]/) !== null) {
                  var result15 = input.charAt(pos);
                  pos++;
                } else {
                  var result15 = null;
                  if (reportMatchFailures) {
                    matchFailed("[^\\]]");
                  }
                }
                if (result15 !== null) {
                  var result14 = [];
                  while (result15 !== null) {
                    result14.push(result15);
                    if (input.substr(pos).match(/^[^\]]/) !== null) {
                      var result15 = input.charAt(pos);
                      pos++;
                    } else {
                      var result15 = null;
                      if (reportMatchFailures) {
                        matchFailed("[^\\]]");
                      }
                    }
                  }
                } else {
                  var result14 = null;
                }
                if (result14 !== null) {
                  var result8 = result14;
                } else {
                  var savedPos2 = pos;
                  if (input.substr(pos, 1) === "]") {
                    var result10 = "]";
                    pos += 1;
                  } else {
                    var result10 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"]\"");
                    }
                  }
                  if (result10 !== null) {
                    var savedPos3 = pos;
                    var savedReportMatchFailuresVar0 = reportMatchFailures;
                    reportMatchFailures = false;
                    var savedPos4 = pos;
                    var savedReportMatchFailuresVar1 = reportMatchFailures;
                    reportMatchFailures = false;
                    if (input.substr(pos, 1) === "]") {
                      var result13 = "]";
                      pos += 1;
                    } else {
                      var result13 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"]\"");
                      }
                    }
                    reportMatchFailures = savedReportMatchFailuresVar1;
                    if (result13 === null) {
                      var result12 = '';
                    } else {
                      var result12 = null;
                      pos = savedPos4;
                    }
                    reportMatchFailures = savedReportMatchFailuresVar0;
                    if (result12 !== null) {
                      var result11 = '';
                      pos = savedPos3;
                    } else {
                      var result11 = null;
                    }
                    if (result11 !== null) {
                      var result9 = [result10, result11];
                    } else {
                      var result9 = null;
                      pos = savedPos2;
                    }
                  } else {
                    var result9 = null;
                    pos = savedPos2;
                  }
                  if (result9 !== null) {
                    var result8 = result9;
                  } else {
                    var result8 = null;;
                  };
                }
              }
              if (result6 !== null) {
                if (input.substr(pos, 2) === "]]") {
                  var result7 = "]]";
                  pos += 2;
                } else {
                  var result7 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"]]\"");
                  }
                }
                if (result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7];
                } else {
                  var result1 = null;
                  pos = savedPos1;
                }
              } else {
                var result1 = null;
                pos = savedPos1;
              }
            } else {
              var result1 = null;
              pos = savedPos1;
            }
          } else {
            var result1 = null;
            pos = savedPos1;
          }
        } else {
          var result1 = null;
          pos = savedPos1;
        }
        var result2 = result1 !== null
          ? (function(rubyBase, rubyText) {
              return tagRuby(trim(rubyBase.join('')), trim(serialize(rubyText).join('')));
            })(result1[1], result1[3])
          : null;
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_newLine() {
        var cacheKey = 'newLine@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result5 = parse_LF();
        if (result5 !== null) {
          var result0 = result5;
        } else {
          var savedPos0 = pos;
          var result2 = parse_CR();
          if (result2 !== null) {
            var result4 = parse_LF();
            var result3 = result4 !== null ? result4 : '';
            if (result3 !== null) {
              var result1 = [result2, result3];
            } else {
              var result1 = null;
              pos = savedPos0;
            }
          } else {
            var result1 = null;
            pos = savedPos0;
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_ALPHA() {
        var cacheKey = 'ALPHA@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[A-Z]/) !== null) {
          var result2 = input.charAt(pos);
          pos++;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("[A-Z]");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos).match(/^[a-z]/) !== null) {
            var result1 = input.charAt(pos);
            pos++;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("[a-z]");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_BIT() {
        var cacheKey = 'BIT@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "0") {
          var result2 = "0";
          pos += 1;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("\"0\"");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos, 1) === "1") {
            var result1 = "1";
            pos += 1;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("\"1\"");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CHAR() {
        var cacheKey = 'CHAR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[-]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[-]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CR() {
        var cacheKey = 'CR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "\r") {
          var result0 = "\r";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"\\r\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CRLF() {
        var cacheKey = 'CRLF@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var savedPos0 = pos;
        var result1 = parse_CR();
        if (result1 !== null) {
          var result2 = parse_LF();
          if (result2 !== null) {
            var result0 = [result1, result2];
          } else {
            var result0 = null;
            pos = savedPos0;
          }
        } else {
          var result0 = null;
          pos = savedPos0;
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_CTL() {
        var cacheKey = 'CTL@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[\0-]/) !== null) {
          var result2 = input.charAt(pos);
          pos++;
        } else {
          var result2 = null;
          if (reportMatchFailures) {
            matchFailed("[\\0-]");
          }
        }
        if (result2 !== null) {
          var result0 = result2;
        } else {
          if (input.substr(pos, 1) === "") {
            var result1 = "";
            pos += 1;
          } else {
            var result1 = null;
            if (reportMatchFailures) {
              matchFailed("\"\"");
            }
          }
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DIGIT() {
        var cacheKey = 'DIGIT@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[0-9]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[0-9]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_DQUOTE() {
        var cacheKey = 'DQUOTE@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^["]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[\"]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_HEXDIG() {
        var cacheKey = 'HEXDIG@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result7 = parse_DIGIT();
        if (result7 !== null) {
          var result0 = result7;
        } else {
          if (input.substr(pos, 1) === "A") {
            var result6 = "A";
            pos += 1;
          } else {
            var result6 = null;
            if (reportMatchFailures) {
              matchFailed("\"A\"");
            }
          }
          if (result6 !== null) {
            var result0 = result6;
          } else {
            if (input.substr(pos, 1) === "B") {
              var result5 = "B";
              pos += 1;
            } else {
              var result5 = null;
              if (reportMatchFailures) {
                matchFailed("\"B\"");
              }
            }
            if (result5 !== null) {
              var result0 = result5;
            } else {
              if (input.substr(pos, 1) === "C") {
                var result4 = "C";
                pos += 1;
              } else {
                var result4 = null;
                if (reportMatchFailures) {
                  matchFailed("\"C\"");
                }
              }
              if (result4 !== null) {
                var result0 = result4;
              } else {
                if (input.substr(pos, 1) === "D") {
                  var result3 = "D";
                  pos += 1;
                } else {
                  var result3 = null;
                  if (reportMatchFailures) {
                    matchFailed("\"D\"");
                  }
                }
                if (result3 !== null) {
                  var result0 = result3;
                } else {
                  if (input.substr(pos, 1) === "E") {
                    var result2 = "E";
                    pos += 1;
                  } else {
                    var result2 = null;
                    if (reportMatchFailures) {
                      matchFailed("\"E\"");
                    }
                  }
                  if (result2 !== null) {
                    var result0 = result2;
                  } else {
                    if (input.substr(pos, 1) === "F") {
                      var result1 = "F";
                      pos += 1;
                    } else {
                      var result1 = null;
                      if (reportMatchFailures) {
                        matchFailed("\"F\"");
                      }
                    }
                    if (result1 !== null) {
                      var result0 = result1;
                    } else {
                      var result0 = null;;
                    };
                  };
                };
              };
            };
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_HTAB() {
        var cacheKey = 'HTAB@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "	") {
          var result0 = "	";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"	\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LF() {
        var cacheKey = 'LF@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === "\n") {
          var result0 = "\n";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\"\\n\"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_LWSP() {
        var cacheKey = 'LWSP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result0 = [];
        var result5 = parse_WSP();
        if (result5 !== null) {
          var result1 = result5;
        } else {
          var savedPos0 = pos;
          var result3 = parse_CRLF();
          if (result3 !== null) {
            var result4 = parse_WSP();
            if (result4 !== null) {
              var result2 = [result3, result4];
            } else {
              var result2 = null;
              pos = savedPos0;
            }
          } else {
            var result2 = null;
            pos = savedPos0;
          }
          if (result2 !== null) {
            var result1 = result2;
          } else {
            var result1 = null;;
          };
        }
        while (result1 !== null) {
          result0.push(result1);
          var result5 = parse_WSP();
          if (result5 !== null) {
            var result1 = result5;
          } else {
            var savedPos0 = pos;
            var result3 = parse_CRLF();
            if (result3 !== null) {
              var result4 = parse_WSP();
              if (result4 !== null) {
                var result2 = [result3, result4];
              } else {
                var result2 = null;
                pos = savedPos0;
              }
            } else {
              var result2 = null;
              pos = savedPos0;
            }
            if (result2 !== null) {
              var result1 = result2;
            } else {
              var result1 = null;;
            };
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_OCTET() {
        var cacheKey = 'OCTET@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[\0-\xFF]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[\\0-\\xFF]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_SP() {
        var cacheKey = 'SP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos, 1) === " ") {
          var result0 = " ";
          pos += 1;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("\" \"");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_VCHAR() {
        var cacheKey = 'VCHAR@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        if (input.substr(pos).match(/^[!-~]/) !== null) {
          var result0 = input.charAt(pos);
          pos++;
        } else {
          var result0 = null;
          if (reportMatchFailures) {
            matchFailed("[!-~]");
          }
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function parse_WSP() {
        var cacheKey = 'WSP@' + pos;
        var cachedResult = cache[cacheKey];
        if (cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result;
        }
        
        
        var result2 = parse_SP();
        if (result2 !== null) {
          var result0 = result2;
        } else {
          var result1 = parse_HTAB();
          if (result1 !== null) {
            var result0 = result1;
          } else {
            var result0 = null;;
          };
        }
        
        
        
        cache[cacheKey] = {
          nextPos: pos,
          result:  result0
        };
        return result0;
      }
      
      function buildErrorMessage() {
        function buildExpected(failuresExpected) {
          failuresExpected.sort();
          
          var lastFailure = null;
          var failuresExpectedUnique = [];
          for (var i = 0; i < failuresExpected.length; i++) {
            if (failuresExpected[i] !== lastFailure) {
              failuresExpectedUnique.push(failuresExpected[i]);
              lastFailure = failuresExpected[i];
            }
          }
          
          switch (failuresExpectedUnique.length) {
            case 0:
              return 'end of input';
            case 1:
              return failuresExpectedUnique[0];
            default:
              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(', ')
                + ' or '
                + failuresExpectedUnique[failuresExpectedUnique.length - 1];
          }
        }
        
        var expected = buildExpected(rightmostMatchFailuresExpected);
        var actualPos = Math.max(pos, rightmostMatchFailuresPos);
        var actual = actualPos < input.length
          ? quote(input.charAt(actualPos))
          : 'end of input';
        
        return 'Expected ' + expected + ' but ' + actual + ' found.';
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i <  rightmostMatchFailuresPos; i++) {
          var ch = input.charAt(i);
          if (ch === '\n') {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === '\r' | ch === '\u2028' || ch === '\u2029') {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      
    function serialize(array) {
      
      var ret = [];
      
      for (var i = 0; i < array.length; i++) {
      
        if (typeof array[i] === 'object') {
      
          ret = ret.concat(serialize(array[i]));
      
        } else {
      
          ret.push(array[i]);
      
        }
      
      }
      
      return ret;
      
    }
      
  
      
    function trim(string) {
      
      return string.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      
    }
      
  
      
    function text(chars) {
      
      return { type: 'text', val: chars };
      
    }
      
  
      
    function tagNewpage() {
      
      return { type: 'tag', name: 'newpage' };
      
    }
      
  
      
    function tagChapter(title) {
      
      return { type: 'tag', name: 'chapter', title: title };
      
    }
      
  
      
    function tagPixivimage(illustID, pageNumber) {
      
      return {
      
        type: 'tag',
      
        name: 'pixivimage',
      
        illustID: illustID,
      
        pageNumber: pageNumber || null
      
      };
      
    }
      
  
      
    function tagJump(pageNumber) {
      
      return {
      
        type: 'tag',
      
        name: 'jump',
      
        pageNumber: pageNumber
      
      };
      
    }
      
  
      
    function tagJumpuri(title, uri) {
      
      return {
      
        type: 'tag',
      
        name: 'jumpuri',
      
        title: title,
      
        uri: uri
      
      };
      
    }
      
  
      
    function tagRuby(rubyBase, rubyText) {
      
      return {
      
        type: 'tag',
      
        name: 'rb',
      
        rubyBase: rubyBase,
      
        rubyText: rubyText
      
      };
      
    }
      
  
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostMatchFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostMatchFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var errorPosition = computeErrorPosition();
        throw new this.SyntaxError(
          buildErrorMessage(),
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(message, line, column) {
    this.name = 'SyntaxError';
    this.message = message;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
module.exports = parser;
}());
},{}]},{},[1]);
