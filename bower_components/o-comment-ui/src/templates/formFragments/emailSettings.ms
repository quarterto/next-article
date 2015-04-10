{{#selects}}
    <label for="{{name}}" class="label-inline" style="width: 75%;">{{label}}</label>
    <select name="{{name}}" id="{{name}}" class="input-inline" style="width: 24%;">
        {{#options}}
            <option value="{{val}}" {{#selected}}selected="selected"{{/selected}}>{{label}}</option>
        {{/options}}
    </select>
    <div class="clear"></div>
{{/selects}}

<br/>

{{#checkboxes}}
    <label for="{{name}}" class="label-inline" style="width: 75%">{{label}}</label>
    <input type="checkbox" class="checkbox" name="{{name}}" id="{{name}}" {{#checked}}checked="checked"{{/checked}}>
{{/checkboxes}}
