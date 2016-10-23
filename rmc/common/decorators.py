import datetime
from functools import update_wrapper
import threading


class cached_property(object):
    """A read-only @property that is only evaluated once.
    The value is cached on the object itself rather than the function or class;
    this should prevent memory leakage.
    From http://www.toofishes.net/blog/python-cached-property-decorator/
    and https://github.com/mitsuhiko/werkzeug/blob/master/werkzeug/utils.py#L30
    """

    def __init__(self, fget):
        update_wrapper(self, fget)
        self.fget = fget

    def __get__(self, obj, cls):
        if obj is None:
            return self
        try:
            result = obj.__dict__[self.__name__]
        except KeyError:
            result = self.fget(obj)
            obj.__dict__[self.__name__] = result
        return result


class classproperty(object):
    """A read-only @property for use as a class attribute.
    Usage::
        >>> class Test(object):
        ...     @classproperty
        ...     def test(cls):
        ...         # calculate something important here
        ...         return 42
        >>> Test.test
        42
        >>> t = Test()
        >>> t.test
        42
    """

    def __init__(self, fget):
        update_wrapper(self, fget)
        self.fget = fget

    def __get__(self, obj, cls):
        return self.fget(cls)


class cached_classproperty(classproperty):
    """A cached read-only @property for use as a class attribute.
    WARNING: the use of this decorator is not thread-safe, except
    for its initialization. Look at __get__() and empty_cache()
    docstrings for more information.
    Therefore, the decorated function shouldn't have any side
    effects.
    Usage::
        >>> class Test(object):
        ...     @cached_classproperty
        ...     def test(cls):
        ...         # calculate something important here
        ...         return 42
        >>> Test.test
        42
        >>> t = Test()
        >>> t.test
        42
    """

    _cache = {}
    _index = 0
    _lock = threading.Lock()

    def __init__(self, *args, **kwargs):
        super(cached_classproperty, self).__init__(*args, **kwargs)
        cls = type(self)
        with cls._lock:
            self._current_index = cls._index
            cls._index += 1

    def __get__(self, obj, cls):
        """Launch the decorated function and replace it by its result(s).
        WARNING: the method is not thread-safe.
        Basically it means the method can be called twice at the same time
        by two different threads.
        """

        if self._current_index not in self._cache:
            self._cache[self._current_index] = self.fget(cls)
        return self._cache[self._current_index]

    @classmethod
    def empty_cache(cls):
        """Empty the entire cache.
        WARNING: this method is not thread-safe.
        Use case: emptying cache in test teardown.
        In any other case, be sure your use-case is thread-safe.
        """

        cls._cache = {}
