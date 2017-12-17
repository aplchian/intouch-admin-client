import React, { Component } from "react"
import List, {
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from "material-ui/List"
import FAB from "../../components/FAB"
import Button from "material-ui/Button"
import Dialog, {
  DialogActions,
  DialogContent,
  DialogTitle
} from "material-ui/Dialog"
import { withStyles, createStyleSheet } from "material-ui/styles"
import { Field, reduxForm } from "redux-form"
import Slide from "material-ui/transitions/Slide"
import MaterialInput from "../../components/MaterialInput"
import "rc-time-picker/assets/index.css"
import buildNewScheduleItem from "./lib/buildNewScheduleItem"
import {
  inc,
  times,
  toString,
  length,
  curry,
  merge,
  assoc,
  map,
  lensProp,
  over,
  reject
} from "ramda"
import IconButton from "material-ui/IconButton"
import DeleteIcon from "material-ui-icons/Delete"
import moment from "moment-timezone"

const styleSheet = createStyleSheet("TextFields", theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200
  }
}))

class Schedule extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      hour: "12",
      minute: "00",
      timeOfDay: "pm",
      endTime: {
        hour: "12",
        minute: "00",
        timeOfDay: "pm",
        hasEndTime: false
      }
    }
  }

  resetTime = () => {
    this.setState({
      open: false,
      hour: "12",
      minute: "00",
      timeOfDay: "pm",
      endTime: {
        hour: "12",
        minute: "00",
        timeOfDay: "pm",
        hasEndTime: false
      }
    })
  }

  handleOnAdd = formData => {
    const { event: { date } } = this.props
    const updatedEvent = buildNewScheduleItem(this.state, date, formData)
    this.resetTime()
    this.props.reset()
    this.props.onAddEvent(updatedEvent)
  }

  handleRemoveEvent = id => {
    const { event } = this.props
    return e => {
      // eslint-disable-next-line
      if (confirm("Are you sure you want to remove this event?")) {
        const removeEvent = schedule => {
          return reject(event => event.id === id, schedule)
        }
        const scheduleLens = lensProp("schedule")
        const updatedEvent = over(scheduleLens, removeEvent, event)
        this.props.updateEvent(updatedEvent)
      }
    }
  }

  handleTimeChange = path => {
    return e => {
      const currentState = assoc(path, e.target.value, this.state)
      this.setState(currentState)
    }
  }

  handleTimeChangeEnd = path => {
    return e => {
      const endTime = assoc(path, e.target.value, this.state.endTime)
      const currentState = merge(this.state, { endTime })
      this.setState(currentState)
    }
  }

  handleToggleEndTime = action => {
    return e => {
      const hasEndTime = action === "show"
      const updatedEndTime = merge(this.state.endTime, { hasEndTime })
      this.setState({ endTime: updatedEndTime })
    }
  }

  render() {
    const { classes } = this.props

    const renderTime = curry((type, i) => {
      const val = type === "hour" ? toString(inc(i)) : toString(i)
      const stringifiedVal =
        length(val) === 1 && type === "minute" ? `0${val}` : val
      return <option value={stringifiedVal}>{stringifiedVal}</option>
    })

    const renderSchedule = item => {
      const getDifference = time => {
        const start = moment(time.string, "h:mm a")
        const end = moment(time.endString, "h:mm a")
        const diff = end.diff(start, "minutes")
        const formatMins = diff => (diff % 60 === 0 ? "" : ` ${diff % 60} m`)
        const toRender =
          diff / 60 >= 1
            ? `(${Math.floor(diff / 60)} h${formatMins(diff)})`
            : `(${diff} m)`

        return <span className="f6 gray">{toRender}</span>
      }

      const time = item.time.hasEndTime ? (
        <span>
          {`${item.time.string} - ${item.time.endString}`}{" "}
          {getDifference(item.time)}
        </span>
      ) : (
        <span>{item.time.string}</span>
      )

      return (
        <ListItem button>
          <ListItemText primary={time} secondary={item.name} />
          <ListItemSecondaryAction>
            <IconButton
              aria-label="delete"
              onClick={this.handleRemoveEvent(item.id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )
    }

    return (
      <div>
        <List>
          {length(this.props.event.schedule) > 0 ? (
            map(renderSchedule, this.props.event.schedule)
          ) : (
            <h1>No schedule items! Click the + to add a schedule item.</h1>
          )}
        </List>
        <Dialog
          open={this.state.open}
          onRequestClose={() => this.setState({ open: false })}
          transition={<Slide direction="up" />}
        >
          <DialogTitle>Add Event</DialogTitle>
          <DialogContent>
            <form className="mt2">
              <Field
                component={MaterialInput}
                type="text"
                name="name"
                placeholder="Event"
                classes={classes}
              />
              <div>
                <select
                  value={this.state.hour}
                  onChange={this.handleTimeChange("hour")}
                >
                  {times(renderTime("hour"), 12)}
                </select>
                <span> : </span>
                <select
                  value={this.state.minute}
                  onChange={this.handleTimeChange("minute")}
                >
                  {times(renderTime("minute"), 60)}
                </select>
                <select
                  value={this.state.timeOfDay}
                  onChange={this.handleTimeChange("timeOfDay")}
                  className="ml1"
                >
                  <option value="pm">pm</option>
                  <option value="am">am</option>
                </select>
              </div>
              <div className="db w-100 cf">
                <div className="db w-100 mb2 pointer">
                  {this.state.endTime.hasEndTime ? (
                    <span
                      onClick={this.handleToggleEndTime("hide")}
                      className="link fr f6 blue mt2"
                    >
                      remove ending time
                    </span>
                  ) : (
                    <span
                      onClick={this.handleToggleEndTime("show")}
                      className="link fr f6 blue mt2"
                    >
                      add ending time
                    </span>
                  )}
                </div>
              </div>
              <div>
                {this.state.endTime.hasEndTime && (
                  <div>
                    <select
                      value={this.state.endTime.hour}
                      onChange={this.handleTimeChangeEnd("hour")}
                    >
                      {times(renderTime("hour"), 12)}
                    </select>
                    <span> : </span>
                    <select
                      value={this.state.endTime.minute}
                      onChange={this.handleTimeChangeEnd("minute")}
                    >
                      {times(renderTime("minute"), 60)}
                    </select>
                    <select
                      value={this.state.endTime.timeOfDay}
                      onChange={this.handleTimeChangeEnd("timeOfDay")}
                      className="ml1"
                    >
                      <option value="pm">pm</option>
                      <option value="am">am</option>
                    </select>
                  </div>
                )}
              </div>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.resetTime} color="primary">
              Cancel
            </Button>
            <Button
              onClick={this.props.handleSubmit(this.handleOnAdd)}
              color="primary"
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
        <FAB onClick={() => this.setState({ open: true })} />
      </div>
    )
  }
}

const addForm = Schedule =>
  reduxForm({
    form: "addScheduleItem"
  })(Schedule)

export default addForm(withStyles(styleSheet)(Schedule))
