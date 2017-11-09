/**
 * @license
 * Adaptive E-Learning Sim Control API (CAPI).
 *
 * Copyright 2011 Smart Sparrow Pty. Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(['check', './SimCapiTypes'], function(check, SimCapiTypes) {


    function parseBoolean(value) {
        if (check(value).passive().isBoolean()) {
            return value;
        } else if (check(value).passive().isString()) {
            return value === 'true';
        }
        return value;
    }

    function parseArray(value) {
        if (check(value).passive().isArray()) {
            return value;
        } else if (isArray(value)) {
            var elements = value.substring(1, value.length - 1).split(',');
            var isEmpty = elements.length === 1 && elements[0] === '';
            var parsedArray = isEmpty ? [] : elements;
            
            return parsedArray.map(function(element) {
                if(element.match(/^\s+$/)) {
                    return element;
                } else {
                    return element.trim();
                }
            });
        }

        return value;
    }

    function isArray(value) {
        return value.charAt(0) === '[' &&
            value.charAt(value.length - 1) === ']';
    }

    var SimCapiValue = function(options) {

        var getType = function(value, allowedValues) {
            var passiveValue = check(value).passive();
            var type;

            if (allowedValues) {
                check(allowedValues).each().isString();
                type = SimCapiTypes.TYPES.ENUM;
            }
            //Booleans must be checked before strings.
            else if (passiveValue.isBoolean()) {
                type = SimCapiTypes.TYPES.BOOLEAN;
            } else if (passiveValue.isNumber()) {
                type = SimCapiTypes.TYPES.NUMBER;
            } else if (passiveValue.isArray() || isArray(value)) {
                type = SimCapiTypes.TYPES.ARRAY;
            } else if (passiveValue.isString()) {
                type = SimCapiTypes.TYPES.STRING;
            } else {
                throw new Error('can not determined type');
            }

            return type;
        };

        var parseValue = function(value, type, allowedValues) {
            switch (type) {
                case SimCapiTypes.TYPES.NUMBER:
                    check(parseFloat(value)).isNumber();
                    value = parseFloat(value);
                    break;
                case SimCapiTypes.TYPES.STRING:
                    value = String(value);
                    break;
                case SimCapiTypes.TYPES.BOOLEAN:
                    value = parseBoolean(value);
                    check(value).isBoolean();
                    break;
                case SimCapiTypes.TYPES.ARRAY:
                    value = parseArray(value);
                    check(value).isArray();
                    break;
                case SimCapiTypes.TYPES.ENUM:
                    check(value).isString();
                    check(allowedValues).each().isString();

                    if (allowedValues.indexOf(value) === -1) {
                        throw new Error('value is not allowed.');
                    }
                    break;
                case SimCapiTypes.TYPES.MATH_EXPR:
                    check(value).isString();
                    break;
                case SimCapiTypes.TYPES.ARRAY_POINT:
                    value = parseArray(value);
                    check(value).isArray();
                    break;
            }

            return value;
        };


        // Ensure that options is initialized. This is just making code cleaner by avoiding lots of
        // null checks
        options = options || {};

        /*
         *  The original attribute name associated with this SimCapiValue
         */
        this.key = options.key || null;
        check(this.key).isString();

        /*
         * The value type.
         */
        this.type = options.type || null;

        /*
         * The value of this object.
         */
        this.value = (options.value !== undefined || options.value !== null) ? options.value : null;

        /*
         * True if and only if, this value can NOT be written to. Any request to change
         * the value of this key, will be ignored.
         */
        this.readonly = options.readonly || false;

        /*
         * True if and only if, this value can NOT be read from.
         * This is not actually enforced, but only used for filtering the condition editor in the author.
         */
        this.writeonly = options.writeonly || false;

        /*
         * List of possible values for enum
         */
        this.allowedValues = options.allowedValues || null;

        /*
         * Optional. If provided a the name of a global capi property, this capi property's value will
         * bind to that property's value.
         */
        this.bindTo = options.bindTo || null;
        if(this.bindTo) {
            check(this.bindTo).isString();
        }

        if (this.type) {
            //we have a type so we only need to parse the value
            this.value = parseValue(this.value, this.type, this.allowedValues);
        } else if (this.value !== undefined && this.value !== null) {
            //we don't have a type but we have a value, we can infer the type
            this.type = getType(this.value, this.allowedValues);

            //If determined to be of type array but value is a string, convert it.
            if (this.type === SimCapiTypes.TYPES.ARRAY && check(this.value).passive().isString()) {
                this.value = parseArray(this.value);
            }
        } else {
            throw new Error('Value nor type was given');
        }

        this.setValue = function(value) {
            this.value = parseValue(value, this.type, this.allowedValues);
        };

        this.toString = function() {
            if (this.value === null || this.value === undefined) {
              return 'null';
            }

            if (check(this.value).passive().isArray()) {
              return '[' + this.value.toString() + ']';
            }

            return this.value.toString();
        };
    };

    return SimCapiValue;
});
