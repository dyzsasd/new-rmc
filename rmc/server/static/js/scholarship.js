define(
['ext/jquery', 'ext/react', 'ext/classnames', 'util'],
function($, React, classnames, util) {

  /* NEED: Generic expandable container
   * prof.js:75
   * Can give the number to show at the start
   * The React class to display
   * */

  var ScholarshipContainer = React.createClass({displayName: "ScholarshipContainer",
    propTypes: {
      scholarshipData: React.PropTypes.array.isRequired
    },

    getInitialState: function() {
      return {
        expanded: false,
        minShow: 5,
        removedIds: []
      }
    },

    toggleExpand: function() {
      var self = this;

      if (this.state.expanded) {
        var navBarHeight = $("#site-nav").height();
        var margin = 16;
        var titleTop = $(React.findDOMNode(self.refs.title)).offset().top;
        $('html,body').animate({
          scrollTop: titleTop - navBarHeight - margin
        }, 300);

        $('.expanded-scholarships').fancySlide('up', 300, function() {
          self.setState({expanded: !self.state.expanded});
        });
      } else {
        $('.expanded-scholarships').fancySlide('down', 300, function() {
          self.setState({expanded: !self.state.expanded});
        });
      }
    },

    numHidden: function() {
      return this.props.scholarshipData.length - this.state.minShow -
          this.state.removedIds.length;
    },

    getFooter: function() {
      var footerSpan;
      if (!this.state.expanded) {
        footerText = 'See ' + this.numHidden() + ' more ' +
            util.pluralize(this.numHidden(), 'scholarship');
        footerSpan = React.createElement("span", null, footerText, "   ", React.createElement("i", {className: "icon-caret-down"}));
      } else {
        footerSpan = React.createElement("span", null, React.createElement("i", {className: "icon-caret-up"}), "   Hide scholarships");
      }

      var footer = (
        React.createElement("div", {className: "expand-footer", onClick: this.toggleExpand}, 
          footerSpan
        )
      )

      if (this.props.scholarshipData.length <= this.state.minShow) {
        footer = (
          React.createElement("div", {className: "empty-footer"}
          )
        )
      }

      return footer;
    },

    addRemovedId: function(i) {
      this.setState({removedIds: this.state.removedIds.concat([i])})
    },

    render: function() {
      var self = this;

      var visibleScholarships = this.props.scholarshipData.
          filter(function(s) {
            return self.state.removedIds.indexOf(s.id) === -1;
          }).
          slice(0, self.state.minShow).
          map(function(data, i) {
            return React.createElement(ScholarshipBox, {key: data.id, data: data, onRemove: self.addRemovedId})
          }
      );

      var hiddenScholarships = this.props.scholarshipData.
          filter(function(s) {
            return self.state.removedIds.indexOf(s.id) === -1;
          }).
          slice(self.state.minShow).
          map(function(data, i) {
            return React.createElement(ScholarshipBox, {key: data.id, data: data, onRemove: self.addRemovedId})
          }
      );

      if (this.props.scholarshipData.length == 0) {
        return null;
      }

      return (
        React.createElement("div", null, 
          React.createElement("h1", {ref: "title", className: "scholarships-header"}, 
            "Scholarships you may qualify for"
          ), 
          React.createElement("div", {className: "scholarship-container"}, 
            visibleScholarships, 
            React.createElement("div", {className: "expanded-scholarships hide-initial"}, 
              hiddenScholarships
            )
          ), 
          this.getFooter()
        )
      );
    }
  });

  var ScholarshipBoxInner = React.createClass({displayName: "ScholarshipBoxInner",
    propTypes: {
      removeFromProfile: React.PropTypes.func.isRequired
    },

    render: function() {
      return (
        React.createElement("div", {className: "scholarship-inner row-fluid"}, 
          React.createElement("div", {className: "span8 left-col"}, 
            this.props.data.description.replace('&amp;', 'and')
          ), 
          React.createElement("div", {className: "span4 right-col"}, 
            React.createElement("ul", null, 
              this.props.data.eligibility.concat(
                  this.props.data.enrollment_year).map(function(req, i) {
                return (React.createElement("li", {key: i}, req));
              })
            )
          ), 
          React.createElement("div", {className: "row-fluid"}, 
            React.createElement("div", {className: "span12 more-info"}, 
              React.createElement("a", {href: this.props.data.link, target: "_blank"}, 
                React.createElement("i", {className: "icon-info-sign"}), " More Info"
              ), 
              React.createElement("a", {onClick: this.props.removeFromProfile}, 
                React.createElement("i", {className: "icon-remove-sign"}), " Remove from profile"
              )
            )
          )
        )
      );
    }
  });

  var ScholarshipBox = React.createClass({displayName: "ScholarshipBox",
    propTypes: {
      data: React.PropTypes.shape({
        id: React.PropTypes.string.isRequired,
        title: React.PropTypes.string.isRequired,
        description: React.PropTypes.string.isRequired,
        eligibility: React.PropTypes.arrayOf(React.PropTypes.string),
        enrollment_year: React.PropTypes.arrayOf(React.PropTypes.string),
        link: React.PropTypes.string.isRequired
      }).isRequired
    },

    getInitialState: function() {
      return {
        expanded: false,
        removed: false
      }
    },

    toggleExpansion: function() {
      this.setState({expanded: !this.state.expanded});
    },

    removeFromProfile: function() {
      this.setState({removed: true});
      $.ajax({
        type: 'DELETE',
        url: '/api/v1/user/scholarships/' + this.props.data.id
      });
      this.props.onRemove(this.props.data.id);
    },

    render: function() {
      if (this.state.removed) {
        return null;
      }

      var classes = classnames({
        'scholarship-content': true,
        'expanded': this.state.expanded
      });

      scholarshipInner = null;

      if (this.state.expanded) {
        scholarshipInner = (React.createElement(ScholarshipBoxInner, {data: this.props.data, 
          removeFromProfile: this.removeFromProfile}));
      }

      return (
        React.createElement("div", {className: classes}, 
          React.createElement("div", {onClick: this.toggleExpansion, className: "visible-section"}, 
            React.createElement("div", {className: "scholarship-title"}, 
              this.props.data.title.replace('&amp;', 'and')
            )
          ), 
          scholarshipInner
        )
      );
    }
  });

  return {
    ScholarshipContainer: ScholarshipContainer
  };
});
