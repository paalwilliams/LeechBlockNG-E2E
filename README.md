# LeechBlock NG E2E for Firefox

Now E2E!

This fork sends a request to add the websites on the activated block list to the filterered websites on an Adguard Home Instance running on Home Assistant, enabling a DNS level block in connection with the browser level block.

This will also schedule the site list to be unblocked in the Home Assistant instance at the correct time.

# Leechblock Configuration

In the `General` page of the Leechblock options, there is a new section added for Adguard Home Options:

![Leechblock Options](./agh_home_settings.png)

Fill out the corresponding fields with the info for your Adguard Home and Home Assistant instances.

The rule will send an HTTP request to your Adguard Home instance to block the domains in the domains list of the blocklist, and some Home Assistant configuration is needed to undo the rules when the block expires.

# Home Assistant Configuration

This is designed around my use case (Adguard Home running as a Home Assistant add on, using a Firefox based browser). This shouldn't be too difficult to adapt to the leechblock chrome repository, if desired. Please create an issue if you have questions.

In order to make this function, you will need to create a datetime (Note: It must be a datetime helper specifically) helper in home assistant for each blocklist you have. At this time, the id **_must_** match blocklist_`<num>`. This can be achieved by creating the helper with the name of `Blocklist <num>` (Home Assistant will create the ID as `blocklist_<num>`.

You will also need to create two shell commands.

The first, will run a command to reset the filtering rules. This should be run on Home Assistant boot. 


You will need to add a shell command in Home Assistant.

`reset_filtering_rules.sh`

```shell
#!/bin/bash
curl --location 'https://<adguard_home_url>/control/filtering/set_rules' --header 'Content-type: application/json' --header 'Authorization: Basic <adguard_home_token>' --data '{"rules":  [ "" ] }'
```

The `rules` list should be a list of rules that you would like permanently applied. 

Example: `["||something.com^"]`

This is necessary, because the `state` attributes that are set on the helper (to expire the block) do not persist between reboots. It's possible to end up in a scenario where rules are blocked in Adguard, but there is no job scheduled to expire the block. 

---

The second shell command is to unset the rules when the block expires. 


`unset_filtering_rules.sh`

```bash
#!/bin/bash

# The first argument sent to the script
remove_list="$1"

# Convert JSON array to bash array
mapfile -t remove_array < <(echo "$remove_list" | jq -r '.[]')

# Fetch the JSON from AdGuard
response=$(curl --location 'https://localhost:3000/control/filtering/status' \
    --header 'Content-type: application/json' \
    --header 'Authorization: Basic <adguard_home_token>' -k)

# Convert user_rules into a bash array
mapfile -t user_rules < <(echo "$response" | jq -r '.user_rules[]')

# Result array
filtered_rules=()

# Filter out items in remove_array
for rule in "${user_rules[@]}"; do
    skip=false
    for remove in "${remove_array[@]}"; do
        if [[ "$rule" == "$remove" ]]; then
            skip=true
            break
        fi
    done
    if ! $skip; then
        filtered_rules+=("$rule")
    fi
done

json_rules=$(printf '%s\n' "${filtered_rules[@]}" | jq -R . | jq -s .)

curl --location 'https://localhost:3000/control/filtering/set_rules' \
     --header 'Content-type: application/json' \
     --header 'Authorization: Basic <adguard_home_token>' \
     --data "{\"rules\": $json_rules}" \
     -k
```

## Create Automation

You'll need to create two automations. One to reset the blocklist when you reboot home assistant (in the currently implementation, the blocklists are storeed in the `attributes` state of the datetime helper. This resets between boots, so there might be a scenario where your rules don't expire in an expected way.

You'll need to create an automation to reset the filtered_services list in Adguard Home once the block expires in Leechblock.

Please note the values in the `triggers[*].at` field. These are the entity IDs of the datetime helpers created earlier.

```yaml
alias: Unset Adguard Rules
description: ""
triggers:
  - trigger: time
    at: input_datetime.blocklist_1
    id: blocklist-1
    weekday:
      - sat
      - fri
      - thu
      - wed
      - tue
      - mon
      - sun
    enabled: true
  - trigger: time
    at: input_datetime.blocklist_2
    id: blocklist-2
    weekday:
      - sat
      - fri
      - thu
      - wed
      - tue
      - mon
      - sun
    enabled: true
  - trigger: time
    at: input_datetime.blocklist_3
    id: blocklist-3
    weekday:
      - sun
      - mon
      - tue
      - wed
      - thu
      - fri
      - sat
  - trigger: time
    at: input_datetime.blocklist_4
    id: blocklist-4
    weekday:
      - sat
      - fri
      - thu
      - wed
      - tue
      - mon
      - sun
    enabled: true
conditions: []
actions:
  - if:
      - condition: trigger
        id:
          - blocklist-1
    then:
      - action: shell_command.unset_filtering_rules
        metadata: {}
        data:
          rules_to_unset: |
            {{ state_attr('input_datetime.blocklist_1', 'rules') }}
      - action: persistent_notification.create
        data:
          message: >
            Trigger ID: {{ trigger.id }} Triggered entity: {{ triggered_entity
            }} Rules: {{ state_attr('input_datetime.blocklist_1', "rules") }}
  - if:
      - condition: trigger
        id:
          - blocklist-2
    then:
      - action: shell_command.unset_filtering_rules
        metadata: {}
        data:
          rules_to_unset: |
            {{ state_attr('input_datetime.blocklist_2', 'rules') }}
  - if:
      - condition: trigger
        id:
          - blocklist-3
    then:
      - action: shell_command.unset_filtering_rules
        metadata: {}
        data:
          rules_to_unset: |
            {{ state_attr('input_datetime.blocklist_3', 'rules') }}
  - if:
      - condition: trigger
        id:
          - blocklist-4
    then:
      - action: shell_command.unset_filtering_rules
        metadata: {}
        data:
          rules_to_unset: |
            {{ state_attr('input_datetime.blocklist_4', 'rules') }}
mode: single
```

---

[![Awesome Humane Tech](https://raw.githubusercontent.com/humanetech-community/awesome-humane-tech/main/humane-tech-badge.svg?sanitize=true)](https://github.com/humanetech-community/awesome-humane-tech)

LeechBlock NG (Next Generation) is a simple productivity tool designed to block those time-wasting sites that can suck the life out of your working day. All you need to do is specify which sites to block and when to block them.

**Author:** James Anderson

**Contributors:** Dario Kolac (graphics) & Robert Gützkow (graphics)

Note that the latest version of [jQuery UI](https://jqueryui.com/) should be installed in the subfolder `jquery-ui`.

**Policy on PRs:** I'm happy to consider PRs, but unless they're relatively simple (e.g., bug fixes or UI tweaks) it will take me some time to review and test them, and even then I may decide not to approve them. Please understand that LeechBlock is just a hobby for me, and I have very little time even to develop my own code, never mind other people's code! If you want to fork LeechBlock and release your own version, you're more than welcome.
